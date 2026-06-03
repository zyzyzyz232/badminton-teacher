/**
 * 验证中继 join(display) 1001/2002 是否成功
 * 用法: node scripts/verify-relay.mjs [ws://host:3456]
 */
import WebSocket from 'ws'

const url = process.argv[2] || process.env.RELAY_WS || 'ws://127.0.0.1:3456'

const ws = new WebSocket(url)
const timer = setTimeout(() => {
  console.error('[verify] 超时')
  process.exit(2)
}, 8000)

ws.on('open', () => {
  console.log('[verify] 连接', url)
  ws.send(
    JSON.stringify({
      type: 'join',
      role: 'display',
      roomId: '1001',
      token: '2002',
    }),
  )
})

ws.on('message', (raw) => {
  const text = String(raw)
  console.log('[verify] RECV', text)
  try {
    const msg = JSON.parse(text)
    if (msg.type === 'joined' && msg.roomId === '1001') {
      console.log('[verify] OK 新版 join 成功')
      clearTimeout(timer)
      ws.close()
      process.exit(0)
    }
    if (msg.type === 'error' && msg.code === 'unauthorized') {
      console.error('[verify] FAIL 仍是旧版 WS（消息无 build / join 不支持 1001）')
      clearTimeout(timer)
      process.exit(1)
    }
  } catch {
    /* ignore */
  }
})

ws.on('error', (e) => {
  console.error('[verify] WS 错误', e.message)
  clearTimeout(timer)
  process.exit(1)
})
