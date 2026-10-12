<template>
  <view class="page">
    <page-nav-bar title="考场" />
    <view class="header-bar" :class="{ connected: socketJoined }">
      <view class="header-content">
        <text class="header-title">{{ examTitle || '考场' }}</text>
        <view class="conn-badge" :class="phaseClass">{{ phaseLabel }}</view>
      </view>
      <text class="status-text">{{ statusLine || examPhaseLabel }}</text>
    </view>

    <view v-if="!socketJoined" class="connect-section">
      <view class="conn-form">
        <text class="conn-form-title">连接大屏中继</text>
        <text class="conn-form-hint">{{ relayHint }}</text>
        <view class="conn-field">
          <text class="conn-label">WS 地址</text>
          <input
            v-model="relayWsInput"
            class="conn-input"
            placeholder="如 10.21.176.161 或 ws://IP:3456"
            :disabled="connecting"
            @blur="applyRelayWsInput"
          />
        </view>
        <view class="conn-meta">
          <text>房间 {{ roomId }} · 令牌 {{ token }}</text>
        </view>
        <view v-if="relayProbeHint" class="conn-probe">{{ relayProbeHint }}</view>
        <view class="conn-quick">
          <button v-if="isDevtools" class="btn-small" :disabled="connecting" @click="useLocalRelay">
            本机 127.0.0.1
          </button>
          <button class="btn-small" :disabled="probingRelay || connecting" @click="probeRelayServer">
            {{ probingRelay ? '探测中…' : '探测中继' }}
          </button>
        </view>
      </view>
      <text class="connect-hint">请确保大屏已开启并显示同一房间号</text>
      <button class="btn-connect" :disabled="connecting" @click="handleConnect">
        {{ connecting ? '连接中…' : '连接大屏' }}
      </button>
    </view>

    <view v-if="socketJoined && examPhase !== 'running' && examPhase !== 'finished'" class="card">
      <view class="card-head">
        <text class="card-title">考核项</text>
        <text class="card-sub">共 {{ examItems.length }} 项</text>
      </view>
      <view v-if="!examItems.length" class="empty-tip">暂无考核项</view>
      <view
        v-for="(item, idx) in examItems"
        :key="item.id"
        class="list-row"
        :class="{ active: item.id === currentItemId }"
        @click="selectExamItem(item.id)"
      >
        <text class="row-main">{{ idx + 1 }}. {{ item.title }}</text>
        <text class="row-meta">{{ item.weight != null ? item.weight + '%' : '' }}</text>
      </view>
      <view class="btn-row">
        <button class="btn-ghost" :disabled="!currentItemId" @click="toggleExamVideo">
          {{ videoPlaying ? '暂停播片' : '播放资料' }}
        </button>
        <button class="btn-ghost" :disabled="loadingBriefing" @click="pushExamBriefing">
          {{ loadingBriefing ? '下发中…' : '重新下发讲解' }}
        </button>
      </view>
    </view>

    <view v-if="socketJoined && examPhase !== 'finished'" class="card">
      <view class="card-head">
        <text class="card-title">学员队列</text>
        <text class="card-sub">{{ examinees.length }} 人</text>
      </view>
      <view v-if="loadingStudents" class="empty-tip">加载学员…</view>
      <view v-else-if="!examinees.length" class="empty-tip">暂无学员，请确认班级已添加学生</view>
      <view
        v-for="(row, idx) in examinees"
        :key="row.classStudentId"
        class="student-row"
        :class="{
          active: row.classStudentId === currentExamineeId,
          done: row.status === 'done',
          absent: row.status === 'absent',
        }"
        @click="selectExaminee(row.classStudentId)"
      >
        <view class="student-info">
          <text class="row-main">{{ idx + 1 }}. {{ row.name }}</text>
          <text class="row-meta">
            {{ row.studentNo ? '学号 ' + row.studentNo : '' }}
            {{ statusText(row.status) }}
          </text>
        </view>
        <view v-if="examPhase === 'briefing'" class="order-btns">
          <text class="order-btn" @click.stop="moveExaminee(idx, -1)">上移</text>
          <text class="order-btn" @click.stop="moveExaminee(idx, 1)">下移</text>
        </view>
        <view v-else-if="examPhase === 'running'" class="order-btns">
          <text class="order-btn danger-text" @click.stop="confirmAbsent(row)">缺考</text>
          <text class="order-btn" @click.stop="confirmRestart(row)">重开</text>
        </view>
      </view>
    </view>

    <view v-if="socketJoined && examPhase === 'briefing'" class="action-bar">
      <button class="btn-primary" @click="startExam">开始考试</button>
    </view>
    <view v-if="socketJoined && examPhase === 'running'" class="action-bar">
      <button class="btn-ghost" @click="goRecordActionAnalysis">开始录像</button>
      <button class="btn-ghost" @click="advanceExaminee">下一名</button>
      <button class="btn-primary" @click="finishExam">结束考试</button>
    </view>
    <view v-if="socketJoined && examPhase === 'finished'" class="card finished-card">
      <text class="finished-title">本场考试结束</text>
      <button class="btn-primary" @click="exitAndBack">退出考场</button>
    </view>
    <view v-if="socketJoined && examPhase !== 'finished'" class="action-bar secondary">
      <button class="btn-danger" @click="exitAndBack">退出考试态</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { isMpWeixinDevtools, isMpWeixinDevice } from '../../utils/platform.js'
import {
  resolveRelayWsUrl,
  normalizeRelayWsUrl,
  resolveRelayHttpUrl,
  pickRelayWsUrlsFromInfo,
  pickRelayWsForMobileDevice,
  RELAY_ROOM_ID_DEFAULT,
  RELAY_TOKEN_DEFAULT,
  RELAY_WS_LOCAL,
  RELAY_STORAGE_KEYS,
} from '../../utils/relayConfig.js'
import {
  buildExamBriefingItems,
  fetchClassStudents,
  mapClassStudentToExaminee,
  markExamScoreAbsent,
  restartExamStudent,
} from '../../services/examApi.js'

const examId = ref(0)
const examTitle = ref('')
const courseId = ref(0)
const classId = ref(0)
const className = ref('')

const examItems = ref([])
const examItemsLocal = ref([])
const currentItemId = ref('')
const examinees = ref([])
const currentExamineeId = ref('')
const examPhase = ref('idle')
const videoPlaying = ref(false)
const loadingBriefing = ref(false)
const loadingStudents = ref(false)

const relayWs = ref(resolveRelayWsUrl())
const relayWsInput = ref('')
const relayProbeHint = ref('')
const probingRelay = ref(false)
const isDevtools = isMpWeixinDevtools()
const roomId = ref(RELAY_ROOM_ID_DEFAULT)
const token = ref(RELAY_TOKEN_DEFAULT)
const connecting = ref(false)
const socketJoined = ref(false)
const socketOpen = ref(false)
const statusLine = ref('')

let pageActive = true
let connectSeq = 0
let exitedExam = false
/** @type {WechatMiniprogram.SocketTask | null} */
let socketTask = null

const DIGITS4 = /^\d{4}$/

const connectionPhase = computed(() => {
  if (socketJoined.value) return 'joined'
  if (connecting.value && socketOpen.value) return 'open'
  if (connecting.value) return 'connecting'
  return 'idle'
})

const phaseLabel = computed(() => {
  const map = {
    idle: '未连接',
    connecting: '握手中…',
    open: '已握手，等待 joined',
    joined: '已加入房间',
  }
  return map[connectionPhase.value] || '未知'
})

const phaseClass = computed(() => `phase-${connectionPhase.value}`)

const examPhaseLabel = computed(() => {
  if (examPhase.value === 'briefing') return '开考前讲解'
  if (examPhase.value === 'running') return '考试进行中'
  if (examPhase.value === 'finished') return '本场已结束'
  return className.value ? `${className.value} · 等待连接` : '等待连接'
})

const relayHint = computed(() => {
  if (isDevtools) return '开发者工具：默认连本机 127.0.0.1:3456'
  if (isMpWeixinDevice()) return '真机：填运行 relay 的电脑局域网 IP，点「探测」后再连接'
  return '填写运行 relay-server 的地址，与大屏须一致'
})

function getToken() {
  return uni.getStorageSync('token') || ''
}

function decodeParam(raw) {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function statusText(status) {
  if (status === 'testing') return '考核中'
  if (status === 'done') return '已完成'
  if (status === 'absent') return '缺考'
  return '排队'
}

function closeSocketTask() {
  const task = socketTask
  socketTask = null
  if (!task) return
  try {
    task.close({ fail: () => {} })
  } catch {
    /* noop */
  }
}

function normalizeDigits4(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 4)
}

function persistRelayCredentials() {
  try {
    const ws = relayWs.value.trim()
    if (ws) uni.setStorageSync(RELAY_STORAGE_KEYS.ws, ws)
  } catch {
    /* noop */
  }
}

function loadRelayCredentials() {
  const savedWs = uni.getStorageSync(RELAY_STORAGE_KEYS.ws)
  relayWs.value = resolveRelayWsUrl({ stored: typeof savedWs === 'string' ? savedWs : '' })
  relayWsInput.value = relayWs.value
  roomId.value = RELAY_ROOM_ID_DEFAULT
  token.value = RELAY_TOKEN_DEFAULT
}

function applyRelayWsInput() {
  const normalized = normalizeRelayWsUrl(relayWsInput.value)
  if (!normalized) {
    uni.showToast({ title: 'WS 地址格式无效', icon: 'none' })
    relayWsInput.value = relayWs.value
    return
  }
  relayWs.value = normalized
  relayWsInput.value = normalized
  persistRelayCredentials()
}

function useLocalRelay() {
  relayWs.value = RELAY_WS_LOCAL
  relayWsInput.value = RELAY_WS_LOCAL
  relayProbeHint.value = '已切换为本机中继'
  persistRelayCredentials()
}

function probeRelayServer() {
  applyRelayWsInput()
  const httpUrl = resolveRelayHttpUrl(relayWs.value)
  if (!httpUrl) {
    uni.showToast({ title: '请先填写 WS 地址', icon: 'none' })
    return
  }
  probingRelay.value = true
  relayProbeHint.value = ''
  uni.request({
    url: `${httpUrl}/relay-info`,
    method: 'GET',
    timeout: 8000,
    success: (res) => {
      if (res.statusCode !== 200 || !res.data) {
        relayProbeHint.value = `探测失败 HTTP ${res.statusCode}`
        uni.showToast({ title: '中继不可达', icon: 'none' })
        return
      }
      const info = res.data
      const urls = pickRelayWsUrlsFromInfo(info)
      if (isMpWeixinDevice() && urls.length) {
        const picked = pickRelayWsForMobileDevice(urls)
        if (picked && picked !== relayWs.value) {
          relayWs.value = picked
          relayWsInput.value = picked
          persistRelayCredentials()
        }
      }
      relayProbeHint.value = `OK ${info.build || '?'} · v${info.protocol ?? '?'}`
      uni.showToast({ title: '中继可用', icon: 'success' })
    },
    fail: () => {
      relayProbeHint.value = '探测失败：请确认 IP、防火墙、relay 已启动'
      uni.showToast({ title: '无法访问中继', icon: 'none' })
    },
    complete: () => {
      probingRelay.value = false
    },
  })
}

function sendRaw(obj, opts = {}) {
  const { requireJoined = false } = opts
  if (!pageActive) return false
  if (!socketTask || !socketOpen.value) return false
  if (requireJoined && !socketJoined.value) return false
  socketTask.send({
    data: JSON.stringify(obj),
    fail: (err) => {
      const msg = err?.errMsg || '发送失败'
      if (msg.includes('not OPEN')) {
        socketOpen.value = false
        socketJoined.value = false
        connecting.value = false
        statusLine.value = '连接已断开'
      }
    },
  })
  return true
}

function sendCmd(name, payload) {
  const ok = sendRaw({ type: 'command', name, payload: payload || {} }, { requireJoined: true })
  if (!ok) uni.showToast({ title: '未连接大屏', icon: 'none' })
  return ok
}

function applyExamState(state) {
  if (!state || typeof state !== 'object') return
  if (state.mode === 'exam') {
    examPhase.value = state.examPhase || 'briefing'
    if (Array.isArray(state.examItems) && state.examItems.length) {
      examItems.value = state.examItems
      currentItemId.value = state.currentExamItemId || state.examItems[0].id
    }
    if (Array.isArray(state.examinees) && state.examinees.length) {
      examinees.value = state.examinees
      currentExamineeId.value = state.currentExamineeId || ''
    }
    if (typeof state.videoPlaying === 'boolean') videoPlaying.value = state.videoPlaying
  } else if (state.mode === 'training') {
    examPhase.value = 'idle'
  }
}

function shouldReuseSnapshot(state) {
  if (!state || state.mode !== 'exam') return false
  if (String(state.examId || '') !== String(examId.value)) return false
  return state.examPhase === 'running' || state.examPhase === 'finished'
}

async function loadExamPayload() {
  if (!examId.value) return
  loadingBriefing.value = true
  try {
    const items = (await buildExamBriefingItems(examId.value)).filter((row) => row.id)
    examItems.value = items
    examItemsLocal.value = items
    if (!currentItemId.value || !items.some((i) => i.id === currentItemId.value)) {
      currentItemId.value = items[0]?.id || ''
    }
  } catch (e) {
    uni.showToast({ title: e.message || '加载考核项失败', icon: 'none' })
  } finally {
    loadingBriefing.value = false
  }
}

async function loadStudents() {
  if (!classId.value) {
    examinees.value = []
    return
  }
  loadingStudents.value = true
  try {
    const list = await fetchClassStudents(classId.value)
    examinees.value = list.map(mapClassStudentToExaminee).filter(Boolean)
    currentExamineeId.value = examinees.value[0]?.classStudentId || ''
  } catch (e) {
    examinees.value = []
    uni.showToast({ title: e.message || '获取学员失败', icon: 'none' })
  } finally {
    loadingStudents.value = false
  }
}

function pushExamBriefing() {
  if (!examItems.value.length) {
    uni.showToast({ title: '请至少配置 1 个考核项', icon: 'none' })
    return
  }
  const mediaTok = getToken()
  const sent = sendRaw(
    {
      type: 'command',
      name: 'setExamBriefing',
      payload: {
        examId: String(examId.value),
        examTitle: examTitle.value || '考试',
        items: examItems.value,
        currentItemId: currentItemId.value || examItems.value[0].id,
        mediaBearerToken: mediaTok,
        mediaTenantId: '1',
        examinees: examinees.value.map((row) => ({
          classStudentId: String(row.classStudentId),
          userId: row.userId,
          name: row.name,
          studentNo: row.studentNo,
          status: 'waiting',
        })),
        currentExamineeId: String(
          currentExamineeId.value || examinees.value[0]?.classStudentId || '',
        ),
      },
    },
    { requireJoined: true },
  )
  if (sent) {
    examPhase.value = 'briefing'
    uni.showToast({ title: '已下发讲解', icon: 'success' })
  }
}

function selectExamItem(id) {
  if (examPhase.value !== 'briefing') return
  currentItemId.value = id
  sendCmd('setExamItem', { id })
}

function toggleExamVideo() {
  sendCmd('setExamVideoPlaying', { playing: !videoPlaying.value })
}

function moveExaminee(idx, delta) {
  const next = idx + delta
  if (next < 0 || next >= examinees.value.length) return
  const copy = examinees.value.slice()
  const [row] = copy.splice(idx, 1)
  copy.splice(next, 0, row)
  examinees.value = copy
}

function startExam() {
  if (!socketJoined.value) {
    uni.showToast({ title: '请先连接大屏', icon: 'none' })
    return
  }
  if (examItems.value.length < 1) {
    uni.showToast({ title: '请至少配置 1 个考核项', icon: 'none' })
    return
  }
  if (examinees.value.length < 1) {
    uni.showToast({ title: '请至少有 1 名学员', icon: 'none' })
    return
  }
  const current = examinees.value[0].classStudentId
  currentExamineeId.value = current
  sendCmd('startExam', {
    examinees: examinees.value.map((row) => ({
      classStudentId: String(row.classStudentId),
      userId: row.userId,
      name: row.name,
      studentNo: row.studentNo,
      status: 'waiting',
    })),
    currentExamineeId: String(current),
  })
}

function selectExaminee(classStudentId) {
  if (examPhase.value !== 'running') return
  currentExamineeId.value = classStudentId
  sendCmd('setCurrentExaminee', { classStudentId: String(classStudentId) })
}

function goRecordActionAnalysis() {
  const itemId = String(currentItemId.value)
  const item =
    examItems.value.find((row) => String(row.id) === itemId) ||
    examItemsLocal.value.find((row) => String(row.id) === itemId)
  if (!item) {
    uni.showToast({ title: '请选择考核项', icon: 'none' })
    return
  }
  if (Number(item.algoType) === 2) {
    uni.showToast({ title: '暂未开放', icon: 'none' })
    return
  }
  if (Number(item.algoType) !== 1) {
    uni.showToast({ title: '当前考核项不支持动作分析录像', icon: 'none' })
    return
  }
  const student = examinees.value.find(
    (row) => String(row.classStudentId) === String(currentExamineeId.value),
  )
  if (!student) {
    uni.showToast({ title: '请先选择学员', icon: 'none' })
    return
  }
  if (!student.userId) {
    uni.showToast({ title: '该学员缺少用户编号，无法提交成绩', icon: 'none' })
    return
  }
  if (!classId.value) {
    uni.showToast({ title: '缺少班级信息', icon: 'none' })
    return
  }
  const q = [
    `examId=${examId.value}`,
    `examItemId=${encodeURIComponent(item.id)}`,
    `itemName=${encodeURIComponent(item.title || '')}`,
    `courseId=${courseId.value}`,
    `classId=${classId.value}`,
    `className=${encodeURIComponent(className.value || '')}`,
    `examType=action_recognition`,
    `classStudentId=${encodeURIComponent(student.classStudentId)}`,
    `studentName=${encodeURIComponent(student.name || '')}`,
    `studentNo=${encodeURIComponent(student.studentNo || '')}`,
    `userId=${encodeURIComponent(student.userId || '')}`,
  ].join('&')
  uni.navigateTo({
    url: `/pages/exam-active/exam-active?${q}`,
  })
}

function confirmAbsent(row) {
  if (!row || !row.userId) {
    uni.showToast({ title: '该学员缺少用户编号', icon: 'none' })
    return
  }
  uni.showModal({
    title: '标记缺考',
    content: `将「${row.name || '该学员'}」本场考试记为缺考？`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '提交中...', mask: true })
      try {
        await markExamScoreAbsent({
          examId: examId.value,
          studentId: Number(row.userId),
          classId: classId.value || undefined,
        })
        sendCmd('markExamineeAbsent', { classStudentId: String(row.classStudentId) })
        uni.hideLoading()
        uni.showToast({ title: '已记缺考', icon: 'none' })
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },
  })
}

function confirmRestart(row) {
  if (!row || !row.userId) {
    uni.showToast({ title: '该学员缺少用户编号', icon: 'none' })
    return
  }
  uni.showModal({
    title: '重新开始',
    content: `清空「${row.name || '该学员'}」本场成绩并重新考核？`,
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '提交中...', mask: true })
      try {
        await restartExamStudent({
          examId: examId.value,
          studentId: Number(row.userId),
        })
        sendCmd('restartExaminee', { classStudentId: String(row.classStudentId) })
        uni.hideLoading()
        uni.showToast({ title: '已重开', icon: 'none' })
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },
  })
}

function advanceExaminee() {
  sendCmd('advanceExaminee', {})
}

function finishExam() {
  sendCmd('finishExam', {})
}

function sendExitExamMode() {
  if (exitedExam) return
  if (!socketTask || !socketOpen.value || !socketJoined.value) return
  exitedExam = true
  examPhase.value = 'idle'
  try {
    socketTask.send({
      data: JSON.stringify({ type: 'command', name: 'exitExamMode', payload: {} }),
    })
  } catch {
    /* noop */
  }
}

function exitAndBack() {
  sendExitExamMode()
  uni.navigateBack({ fail: () => {} })
}

function onSocketMessageHandler(res) {
  try {
    const msg = JSON.parse(res.data)
    if (msg.type === 'joined') {
      socketJoined.value = true
      connecting.value = false
      statusLine.value = '已加入房间'
      persistRelayCredentials()
      const authTok = getToken()
      if (authTok) {
        sendRaw(
          { type: 'command', name: 'setMediaAuth', payload: { token: authTok, tenantId: '1' } },
          { requireJoined: true },
        )
      }
      applyExamState(msg.state)
      setTimeout(() => {
        if (!pageActive || !socketJoined.value || !socketOpen.value) return
        if (shouldReuseSnapshot(msg.state)) return
        pushExamBriefing()
      }, 80)
      return
    }
    if (msg.type === 'state' && msg.state) {
      applyExamState(msg.state)
      return
    }
    if (msg.type === 'error') {
      connecting.value = false
      statusLine.value = msg.message || msg.code || '错误'
      if (msg.code === 'mode_conflict') {
        uni.showToast({ title: '当前为大屏考试模式', icon: 'none' })
      } else {
        uni.showToast({ title: statusLine.value, icon: 'none' })
      }
    }
  } catch {
    statusLine.value = '消息解析失败'
  }
}

function startConnect(seq) {
  closeSocketTask()
  const task = uni.connectSocket({
    url: relayWs.value.trim(),
    multiple: true,
    fail: () => {
      if (!pageActive || seq !== connectSeq) return
      connecting.value = false
      socketOpen.value = false
      statusLine.value = '无法发起连接'
    },
  })
  socketTask = task
  task.onOpen(() => {
    if (!pageActive || seq !== connectSeq) return
    socketOpen.value = true
    sendRaw({
      type: 'join',
      role: 'mobile',
      roomId: roomId.value.trim(),
      token: token.value.trim(),
    })
  })
  task.onMessage((res) => {
    if (!pageActive || seq !== connectSeq) return
    onSocketMessageHandler(res)
  })
  task.onError(() => {
    if (!pageActive || seq !== connectSeq) return
    statusLine.value = 'WebSocket 错误'
    connecting.value = false
    socketOpen.value = false
    socketJoined.value = false
  })
  task.onClose(() => {
    if (!pageActive || seq !== connectSeq) return
    if (socketTask === task) socketTask = null
    socketJoined.value = false
    connecting.value = false
    socketOpen.value = false
    statusLine.value = '连接已关闭'
  })
}

function handleConnect() {
  if (socketJoined.value) return
  applyRelayWsInput()
  roomId.value = normalizeDigits4(roomId.value)
  token.value = normalizeDigits4(token.value)
  persistRelayCredentials()
  if (!relayWs.value.trim()) {
    uni.showToast({ title: '请填写 WS 地址', icon: 'none' })
    return
  }
  if (!DIGITS4.test(roomId.value) || !DIGITS4.test(token.value)) {
    uni.showToast({ title: '房间号与令牌均为4位数字', icon: 'none' })
    return
  }
  statusLine.value = ''
  connecting.value = true
  socketOpen.value = false
  socketJoined.value = false
  const seq = ++connectSeq
  closeSocketTask()
  setTimeout(() => {
    if (!pageActive || seq !== connectSeq) return
    startConnect(seq)
  }, 80)
}

function canAutoConnect() {
  return (
    examId.value > 0 &&
    !socketJoined.value &&
    !connecting.value &&
    !!relayWs.value.trim() &&
    DIGITS4.test(roomId.value) &&
    DIGITS4.test(token.value)
  )
}

onLoad(async (options) => {
  options = options || {}
  examId.value = parseInt(options.examId, 10) || 0
  courseId.value = parseInt(options.courseId, 10) || 0
  classId.value = parseInt(options.classId, 10) || 0
  className.value = decodeParam(options.className)
  examTitle.value = decodeParam(options.examTitle) || '考试'
  loadRelayCredentials()
  await Promise.all([loadExamPayload(), loadStudents()])
  if (canAutoConnect()) handleConnect()
})

onUnload(() => {
  pageActive = false
  connectSeq++
  sendExitExamMode()
  const task = socketTask
  socketTask = null
  setTimeout(() => {
    if (!task) return
    try {
      task.close({ fail: () => {} })
    } catch {
      /* noop */
    }
  }, 80)
  socketOpen.value = false
  socketJoined.value = false
  connecting.value = false
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 48rpx;
}

.header-bar {
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 32rpx 40rpx 40rpx;
  color: #fff;

  &.connected {
    background: linear-gradient(135deg, #11998e, #38ef7d);
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
}

.status-text {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.conn-badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  background: rgba(255, 255, 255, 0.25);
}

.phase-connecting {
  background: rgba(255, 193, 7, 0.45);
}

.phase-joined {
  background: rgba(76, 175, 80, 0.45);
}

.connect-section {
  margin: 24rpx;
  padding: 40rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
}

.conn-form-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.conn-form-hint,
.connect-hint,
.conn-meta,
.conn-probe,
.empty-tip {
  font-size: 24rpx;
  color: #888;
}

.conn-field {
  margin-top: 20rpx;
}

.conn-label {
  font-size: 24rpx;
  color: #666;
}

.conn-input {
  margin-top: 8rpx;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
}

.conn-quick {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.btn-small {
  font-size: 24rpx;
  background: #f5f7fa;
}

.btn-connect,
.btn-primary {
  margin-top: 24rpx;
  background: #07c160;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.card {
  margin: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
}

.card-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
}

.card-sub {
  font-size: 24rpx;
  color: #999;
}

.list-row,
.student-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 16rpx;
  border-radius: 12rpx;
  margin-bottom: 8rpx;
  background: #f8fafc;
}

.list-row.active,
.student-row.active {
  background: #e6f9ef;
}

.student-row.done,
.student-row.absent {
  opacity: 0.55;
}

.danger-text {
  color: #ff4d4f !important;
}

.student-info {
  flex: 1;
}

.row-main {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

.row-meta {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.order-btns {
  display: flex;
  gap: 12rpx;
}

.order-btn {
  font-size: 22rpx;
  color: #07c160;
  padding: 8rpx 12rpx;
}

.btn-row,
.action-bar {
  display: flex;
  gap: 16rpx;
  margin: 16rpx 24rpx 0;
}

.btn-row {
  margin: 16rpx 0 0;
}

.btn-ghost {
  flex: 1;
  background: #f5f7fa;
  color: #333;
  font-size: 26rpx;
}

.btn-danger {
  flex: 1;
  background: #fff1f0;
  color: #ff4d4f;
  font-size: 26rpx;
}

.action-bar.secondary {
  margin-top: 8rpx;
}

.finished-card {
  text-align: center;
}

.finished-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 24rpx;
}
</style>
