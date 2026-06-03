/**
 * 测试 media-proxy（需中继已启动且房间内有 mediaBearerToken 或传 token 参数）
 * 用法:
 *   node scripts/test-media-proxy.mjs <videoUrl> [token] [roomId]
 */
import WebSocket from 'ws'

const videoUrl = process.argv[2]
const token = process.argv[3] || ''
const roomId = process.argv[4] || '1001'
const wsBase = process.env.RELAY_WS || 'ws://127.0.0.1:3456'
const httpBase = wsBase.replace(/^ws/i, 'http').replace(/\/$/, '')

if (!videoUrl) {
  console.error('用法: node scripts/test-media-proxy.mjs <videoUrl> [token] [roomId]')
  process.exit(1)
}

async function joinAndSetToken() {
  if (token) return token
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsBase)
    const t = setTimeout(() => reject(new Error('join 超时')), 5000)
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join', role: 'mobile', roomId, token: '2002' }))
    })
    ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw))
      if (msg.type === 'joined') {
        clearTimeout(t)
        ws.close()
        resolve(msg.state?.mediaBearerToken || '')
      }
    })
    ws.on('error', reject)
  })
}

async function main() {
  let authToken = token
  if (!authToken) {
    console.log('[test] 未传 token，尝试从房间 state 读取…')
    authToken = await joinAndSetToken()
  }
  if (!authToken) {
    console.error('[test] 无 token，请先教师端 setPlan/setMediaAuth')
    process.exit(1)
  }
  const q = new URLSearchParams({ url: videoUrl, roomId, token: authToken })
  const proxyUrl = `${httpBase}/media-proxy?${q}`
  console.log('[test] GET', proxyUrl.slice(0, 120), '…')
  const res = await fetch(proxyUrl, { headers: { Range: 'bytes=0-1023' } })
  const ct = res.headers.get('content-type') || ''
  const body = res.ok || res.status === 206 ? `(binary ${(await res.arrayBuffer()).byteLength} bytes)` : await res.text()
  console.log('[test] status', res.status, ct)
  console.log('[test] body', String(body).slice(0, 400))
  if (ct.includes('application/json')) {
    console.error('[test] FAIL 后台返回 JSON 而非 MP4，videoUrl 在服务器上不可访问')
    process.exit(1)
  }
  process.exit(res.ok || res.status === 206 ? 0 : 1)
}

main().catch((e) => {
  console.error('[test]', e.message)
  process.exit(1)
})
