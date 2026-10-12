/**
 * 验证考试态拒绝 setPlan（mode_conflict）且状态不变
 * 用法: node scripts/verify-exam-mode.mjs [ws://host:3456]
 */
import WebSocket from 'ws'

const url = process.argv[2] || process.env.RELAY_WS || 'ws://127.0.0.1:3456'

const ws = new WebSocket(url)
const timer = setTimeout(() => {
  console.error('[verify-exam] 超时')
  process.exit(2)
}, 12000)

let sawBriefing = false
let sawConflict = false
let sawRunning = false
let sawAbsent = false
let sawRestart = false
let briefingExamId = ''

function fail(msg) {
  console.error('[verify-exam] FAIL', msg)
  clearTimeout(timer)
  try {
    ws.close()
  } catch {
    /* ignore */
  }
  process.exit(1)
}

function ok(msg) {
  console.log('[verify-exam] OK', msg)
  clearTimeout(timer)
  try {
    ws.close()
  } catch {
    /* ignore */
  }
  process.exit(0)
}

ws.on('open', () => {
  console.log('[verify-exam] 连接', url)
  ws.send(
    JSON.stringify({
      type: 'join',
      role: 'mobile',
      roomId: '1001',
      token: '2002',
    }),
  )
})

ws.on('message', (raw) => {
  const text = String(raw)
  console.log('[verify-exam] RECV', text.slice(0, 400))
  let msg
  try {
    msg = JSON.parse(text)
  } catch {
    return
  }

  if (msg.type === 'error' && msg.code === 'unauthorized') {
    fail('仍是旧版 WS 或房间令牌错误')
    return
  }

  if (msg.type === 'joined') {
    const state = msg.state || {}
    if (state.mode === 'exam') {
      console.log('[verify-exam] 房间已在考试态，先 exitExamMode')
      ws.send(JSON.stringify({ type: 'command', name: 'exitExamMode', payload: {} }))
    }
    ws.send(
      JSON.stringify({
        type: 'command',
        name: 'setExamBriefing',
        payload: {
          examId: 'verify-exam',
          examTitle: 'mode_conflict 自检',
          items: [{ id: 'item-1', title: '发球' }],
        },
      }),
    )
    return
  }

  if (msg.type === 'state' && msg.state?.mode === 'exam' && msg.state?.examPhase === 'briefing') {
    if (sawConflict) {
      return
    }
    if (!sawBriefing) {
      sawBriefing = true
      briefingExamId = msg.state.examId || 'verify-exam'
      console.log('[verify-exam] briefing 已生效，发送 setPlan')
      ws.send(
        JSON.stringify({
          type: 'command',
          name: 'setPlan',
          payload: {
            plan: [{ id: 'p1', title: '热身', durationMin: 5 }],
            currentItemId: 'p1',
          },
        }),
      )
    }
    return
  }

  if (msg.type === 'error' && msg.code === 'mode_conflict') {
    sawConflict = true
    console.log('[verify-exam] 收到 mode_conflict，开始考试并验证缺考/重开')
    ws.send(
      JSON.stringify({
        type: 'command',
        name: 'startExam',
        payload: {
          examinees: [
            { classStudentId: 's1', name: '甲', status: 'waiting' },
            { classStudentId: 's2', name: '乙', status: 'waiting' },
          ],
          currentExamineeId: 's1',
        },
      }),
    )
    return
  }

  if (msg.type === 'state' && msg.state?.examPhase === 'running' && sawConflict) {
    const list = Array.isArray(msg.state.examinees) ? msg.state.examinees : []
    const s1 = list.find((e) => e.classStudentId === 's1')
    const s2 = list.find((e) => e.classStudentId === 's2')
    if (!sawRunning) {
      sawRunning = true
      if (s1?.status !== 'testing') {
        fail(`开考后 s1 应为 testing，实际 ${s1?.status}`)
        return
      }
      console.log('[verify-exam] running 已生效，发送 markExamineeAbsent')
      ws.send(
        JSON.stringify({
          type: 'command',
          name: 'markExamineeAbsent',
          payload: { classStudentId: 's1' },
        }),
      )
      return
    }
    if (!sawAbsent) {
      if (s1?.status !== 'absent' || s2?.status !== 'testing') {
        fail(`缺考后应为 s1=absent s2=testing，实际 s1=${s1?.status} s2=${s2?.status}`)
        return
      }
      sawAbsent = true
      console.log('[verify-exam] 缺考已生效，发送 restartExaminee')
      ws.send(
        JSON.stringify({
          type: 'command',
          name: 'restartExaminee',
          payload: { classStudentId: 's1' },
        }),
      )
      return
    }
    if (!sawRestart) {
      if (s1?.status !== 'testing') {
        fail(`重开后 s1 应为 testing，实际 ${s1?.status}`)
        return
      }
      sawRestart = true
      ok('mode_conflict + 缺考/重开')
    }
    return
  }

  if (msg.type === 'state' && msg.state?.mode === 'training' && sawBriefing && !sawConflict) {
    fail('setPlan 把考试态切回了 training')
  }
})

ws.on('error', (e) => {
  fail(e.message)
})
