import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import type { SessionState } from './session.js'
import {
  applyCommand,
  createInitialState,
  parseWireCommand,
  tickState,
} from './stateLogic.js'
import type { ClientToServer, ServerToClient } from './protocol.js'
import { describeUpstreamFailure, fetchMediaWithFallback, isMediaContentType } from './mediaProxy.js'

const PORT = Number(process.env.PORT ?? 3456)
const RELAY_PROTOCOL = 2
/** 用于确认机房已部署本仓库完整构建（非旧版 WS） */
const RELAY_BUILD_ID = 'relay-2026-v2'

function requestPath(req: import('node:http').IncomingMessage): string {
  const raw = req.url || '/'
  return raw.split('?')[0] || '/'
}

type ClientMeta = {
  ws: WebSocket
  roomId: string | null
  role: 'display' | 'mobile' | null
}

type Room = {
  id: string
  token: string
  state: SessionState
  clients: Set<WebSocket>
}

const rooms = new Map<string, Room>()
const meta = new Map<WebSocket, ClientMeta>()

const DIGITS4 = /^\d{4}$/

function normalizeCode(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, 4)
}

/** 与 gym_screen / 小程序 relayConfig 默认一致，可用环境变量覆盖 */
const PINNED_ROOM_ID = normalizeCode(process.env.RELAY_PINNED_ROOM_ID ?? '1001')
const PINNED_TOKEN = normalizeCode(process.env.RELAY_PINNED_TOKEN ?? '2002')

function ensurePinnedRoom() {
  if (!DIGITS4.test(PINNED_ROOM_ID) || !DIGITS4.test(PINNED_TOKEN)) {
    console.warn('[relay] 跳过预置房间：RELAY_PINNED_ROOM_ID / RELAY_PINNED_TOKEN 须为 4 位数字')
    return
  }
  if (rooms.has(PINNED_ROOM_ID)) return
  rooms.set(PINNED_ROOM_ID, {
    id: PINNED_ROOM_ID,
    token: PINNED_TOKEN,
    state: createInitialState(),
    clients: new Set(),
  })
  console.log(`[relay] 预置房间 roomId=${PINNED_ROOM_ID} token=${PINNED_TOKEN}`)
}

function randomDigits4(): string {
  const n = randomBytes(2).readUInt16BE(0) % 10000
  return String(n).padStart(4, '0')
}

function randomRoomId(): string {
  for (let attempt = 0; attempt < 200; attempt++) {
    const id = randomDigits4()
    if (!rooms.has(id)) return id
  }
  throw new Error('[relay] no available room id')
}

function randomToken(): string {
  return randomDigits4()
}

function send(ws: WebSocket, msg: ServerToClient) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
}

function broadcastRoom(room: Room) {
  const msg: ServerToClient = { type: 'state', state: room.state }
  const raw = JSON.stringify(msg)
  for (const c of room.clients) {
    if (c.readyState === c.OPEN) c.send(raw)
  }
}

function getRoom(id: string): Room | undefined {
  return rooms.get(id)
}

function deleteRoomIfEmpty(room: Room) {
  if (room.clients.size === 0) {
    // 固定房间常驻，避免大屏重连时房间被清掉
    if (room.id === PINNED_ROOM_ID) return
    rooms.delete(room.id)
  }
}

function isPinnedCredentials(roomId: string, token: string) {
  return roomId === PINNED_ROOM_ID && token === PINNED_TOKEN
}

function attachClient(ws: WebSocket, room: Room) {
  room.clients.add(ws)
  const m = meta.get(ws)
  if (m) m.roomId = room.id
}

function detachClient(ws: WebSocket) {
  const m = meta.get(ws)
  if (!m?.roomId) return
  const room = rooms.get(m.roomId)
  if (room) {
    room.clients.delete(ws)
    deleteRoomIfEmpty(room)
  }
  m.roomId = null
  m.role = null
}

function joinRoomWithCredentials(
  ws: WebSocket,
  role: 'display' | 'mobile',
  roomId: string,
  token: string,
  createIfMissing: boolean,
) {
  const m = meta.get(ws)!
  if (!DIGITS4.test(roomId) || !DIGITS4.test(token)) {
    send(ws, { type: 'error', code: 'bad_join', message: '房间号与令牌均为4位数字' })
    return
  }

  let room = getRoom(roomId)
  if (!room) {
    if (!createIfMissing) {
      send(ws, {
        type: 'error',
        code: 'unauthorized',
        message: '房间不存在或令牌错误，请先启动大屏或确认中继已重启',
      })
      return
    }
    room = {
      id: roomId,
      token,
      state: createInitialState(),
      clients: new Set(),
    }
    rooms.set(room.id, room)
  } else if (room.token !== token) {
    if (role === 'display' && isPinnedCredentials(roomId, token)) {
      room.token = token
      console.log(`[relay] 固定房间 ${roomId} 令牌已同步为预置值`)
    } else {
      send(ws, { type: 'error', code: 'unauthorized', message: '房间号已占用且令牌不匹配' })
      return
    }
  }

  attachClient(ws, room)
  m.roomId = room.id
  m.role = role
  send(ws, {
    type: 'joined',
    roomId: room.id,
    token: room.token,
    role,
    state: room.state,
  })
}

function handleJoin(ws: WebSocket, msg: Extract<ClientToServer, { type: 'join' }>) {
  const m = meta.get(ws)!
  if (m.roomId) {
    send(ws, { type: 'error', code: 'already_joined', message: '已加入房间' })
    return
  }

  const role = String(msg.role ?? '').toLowerCase()
  const roomId = normalizeCode(msg.roomId)
  const token = normalizeCode(msg.token)
  console.log(`[relay] join role=${role} roomId=${roomId || '-'} token=${token ? '****' : '-'}`)

  if (role === 'display') {
    if (roomId && token) {
      joinRoomWithCredentials(ws, 'display', roomId, token, true)
      return
    }
    const id = randomRoomId()
    const randomTok = randomToken()
    const room: Room = {
      id,
      token: randomTok,
      state: createInitialState(),
      clients: new Set(),
    }
    rooms.set(id, room)
    attachClient(ws, room)
    m.role = 'display'
    send(ws, {
      type: 'joined',
      roomId: id,
      token: randomTok,
      role: 'display',
      state: room.state,
    })
    return
  }

  if (role === 'mobile') {
    if (!roomId || !token) {
      send(ws, { type: 'error', code: 'bad_join', message: '缺少房间号或令牌' })
      return
    }
    joinRoomWithCredentials(ws, 'mobile', roomId, token, true)
    return
  }

  send(ws, { type: 'error', code: 'bad_role', message: `未知角色: ${msg.role ?? '(空)'}` })
}

function handleCommand(ws: WebSocket, msg: Extract<ClientToServer, { type: 'command' }>) {
  const m = meta.get(ws)
  if (!m?.roomId) {
    send(ws, { type: 'error', code: 'not_joined', message: '未加入房间' })
    return
  }
  const room = getRoom(m.roomId)
  if (!room) {
    send(ws, { type: 'error', code: 'room_missing', message: '房间已失效' })
    return
  }

  const cmd = parseWireCommand(msg.name, msg.payload)
  if (!cmd) {
    send(ws, { type: 'error', code: 'bad_command', message: '未知命令' })
    return
  }

  room.state = applyCommand(room.state, cmd)
  broadcastRoom(room)
}

const wss = new WebSocketServer({ noServer: true })

function writeCors(res: import('node:http').ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function proxyMedia(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
  rawUrl: string,
) {
  try {
    const u = new URL(rawUrl, 'http://127.0.0.1')
    const target = u.searchParams.get('url')
    const roomId = u.searchParams.get('roomId') || ''
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('missing url')
      return
    }
    let token = u.searchParams.get('token')?.trim() || ''
    const room = roomId ? getRoom(roomId) : undefined
    if (!token && room?.state.mediaBearerToken) {
      token = room.state.mediaBearerToken
    }
    if (!token) {
      res.writeHead(401, {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Relay-Error': 'missing-token',
      })
      res.end(
        JSON.stringify({
          code: 401,
          source: 'relay',
          msg: '缺少视频访问令牌。请带 roomId=1001 且 token=登录令牌，或先让教师端连上同一台中继（勿用 localhost 测远端房间）',
        }),
      )
      return
    }
    const tenantId = room?.state.mediaTenantId || '1'
    const range = typeof req.headers.range === 'string' ? req.headers.range : undefined
    console.log('[relay] media-proxy req', {
      roomId: roomId || '(none)',
      target: target.slice(0, 100),
      token: token ? `${token.slice(0, 8)}…` : 'missing',
      range: range || '-',
    })
    const { response: upstream, tried, lastError } = await fetchMediaWithFallback(
      target,
      token,
      tenantId,
      range,
    )
    console.log('[relay] media-proxy upstream', {
      status: upstream.status,
      contentType: upstream.headers.get('content-type'),
      tried: tried.length,
      first: tried[0]?.slice(0, 80),
      lastError: lastError || 'ok',
    })
    const upstreamCt = upstream.headers.get('content-type')
    if (
      !((upstream.ok || upstream.status === 206) && isMediaContentType(upstreamCt))
    ) {
      const detail = lastError || (await describeUpstreamFailure(upstream))
      res.writeHead(502, {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Relay-Error': 'upstream-not-video',
        'X-Relay-Tried': tried.slice(0, 5).join(' | ').slice(0, 800),
      })
      res.end(
        JSON.stringify({
          code: 502,
          source: 'upstream',
          msg: `后台未返回视频流：${detail}。请确认后台已配置 /plan-materials 静态访问或提供 download 接口`,
          tried: tried.slice(0, 5),
        }),
      )
      return
    }
    const headers: Record<string, string> = {}
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const v = upstream.headers.get(h)
      if (v) headers[h] = v
    }
    if (!headers['content-type']) headers['Content-Type'] = 'video/mp4'
    res.writeHead(upstream.status, headers)
    if (upstream.body) {
      const { Readable } = await import('node:stream')
      const { pipeline } = await import('node:stream/promises')
      // fetch Body 与 Node Readable.fromWeb 的泛型在 TS 5.7 下不完全一致，运行时兼容
      const webBody = upstream.body as import('stream/web').ReadableStream
      await pipeline(Readable.fromWeb(webBody), res)
    } else {
      res.end()
    }
  } catch (e) {
    console.error('[relay] media-proxy error', e)
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    }
    res.end('media proxy error')
  }
}

const server = createServer((req, res) => {
  writeCors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const path = requestPath(req)

  if (path === '/relay-info') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        protocol: RELAY_PROTOCOL,
        build: RELAY_BUILD_ID,
        pinnedRoomId: PINNED_ROOM_ID,
        pinnedToken: PINNED_TOKEN,
        port: PORT,
      }),
    )
    return
  }
  if (path.startsWith('/media-proxy')) {
    void proxyMedia(req, res, req.url || path)
    return
  }
  if (path === '/' || path === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>Relay Server</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;line-height:1.6">
  <h1>中继服务运行中</h1>
  <p>端口 <code>${PORT}</code> 是 <strong>WebSocket</strong> 中继，不是网页地址。</p>
  <p>本页能打开说明 HTTP 正常；<code>/relay-info</code> 应返回 JSON（含 <code>build":"${RELAY_BUILD_ID}"</code>）。</p>
  <h2>正确用法</h2>
  <ol>
    <li>保持本中继运行（当前页面说明服务已启动）</li>
    <li>在 <code>gym_screen</code> 目录执行 <code>npm run dev</code></li>
    <li>浏览器打开大屏前端 <code>http://localhost:5173</code>（gym_screen）</li>
    <li>教师端 H5 请用 <code>http://localhost:5174</code>，勿与 gym_screen 混用 5173 端口</li>
    <li>小程序/遥控端连接 <code>ws://localhost:${PORT}</code>（手机请改用局域网 IP）</li>
  </ol>
  <p>WebSocket 地址：<code>ws://localhost:${PORT}</code></p>
</body>
</html>`)
    return
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not Found')
})

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  ensurePinnedRoom()
  console.log(
    `[relay] ${RELAY_BUILD_ID} protocol v${RELAY_PROTOCOL} pinned room ${PINNED_ROOM_ID}/${PINNED_TOKEN}`,
  )
  console.log(
    `[relay] WebSocket listening on 0.0.0.0:${PORT} (e.g. ws://localhost:${PORT} or ws://<LAN-IP>:${PORT})`,
  )
  console.log(`[relay] HTTP health: http://localhost:${PORT}/  info: http://localhost:${PORT}/relay-info`)
})

wss.on('connection', (ws) => {
  meta.set(ws, { ws, roomId: null, role: null })

  const joinTimer = setTimeout(() => {
    const m = meta.get(ws)
    if (m && !m.roomId) {
      send(ws, { type: 'error', code: 'join_timeout', message: '连接超时，请先发送 join' })
      ws.close()
    }
  }, 15000)

  ws.on('message', (raw) => {
    let data: ClientToServer
    try {
      data = JSON.parse(String(raw)) as ClientToServer
    } catch {
      send(ws, { type: 'error', code: 'bad_json', message: '无效 JSON' })
      return
    }

    if (data.type === 'join') {
      clearTimeout(joinTimer)
      handleJoin(ws, data)
      return
    }
    if (data.type === 'command') {
      handleCommand(ws, data)
    }
  })

  ws.on('close', () => {
    clearTimeout(joinTimer)
    detachClient(ws)
    meta.delete(ws)
  })
})

setInterval(() => {
  for (const room of rooms.values()) {
    const next = tickState(room.state)
    if (next === room.state) continue
    room.state = next
    broadcastRoom(room)
  }
}, 1000)
