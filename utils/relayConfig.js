/**
 * 大屏中继连接配置（与 gym_screen .env、relay-server 预置房间一致）
 * 多端联调：开发者工具连 127.0.0.1；真机填运行 relay 的电脑局域网 IP（可在遥控页「探测」获取）。
 */
import { isMpWeixinDevtools } from './platform.js'

export const RELAY_PORT = 3456
export const RELAY_WS_LOCAL = `ws://127.0.0.1:${RELAY_PORT}`

export const RELAY_ROOM_ID_DEFAULT = '1001'
export const RELAY_TOKEN_DEFAULT = '2002'

/** @deprecated 勿写死机房 IP；真机请在遥控页填写或探测 */
export const RELAY_WS_REMOTE = RELAY_WS_LOCAL

/** @deprecated 使用 resolveRelayWsUrl() */
export const RELAY_WS_DEFAULT = RELAY_WS_LOCAL

export const RELAY_STORAGE_KEYS = {
  ws: 'relayWs',
  roomId: 'relayRoomId',
  token: 'relayToken',
}

/**
 * 规范 WS 地址：支持只填 IP 或 host:port
 * @param {string} input
 * @param {number} [port]
 */
export function normalizeRelayWsUrl(input, port = RELAY_PORT) {
  const raw = String(input ?? '').trim()
  if (!raw) return ''
  if (/^wss?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, '')
  }
  const hostPort = raw.replace(/^\/\//, '').split('/')[0]
  if (/^[\d.a-zA-Z-]+:\d+$/.test(hostPort)) {
    return `ws://${hostPort}`
  }
  if (/^[\d.a-zA-Z.-]+$/.test(hostPort)) {
    return `ws://${hostPort}:${port}`
  }
  return ''
}

/** @param {string} wsUrl */
export function resolveRelayHttpUrl(wsUrl) {
  const ws = normalizeRelayWsUrl(wsUrl)
  if (!ws) return ''
  return ws.replace(/^ws/i, 'http').replace(/\/$/, '')
}

/**
 * @param {{ stored?: string }} [opts]
 */
export function resolveRelayWsUrl(opts = {}) {
  const saved = normalizeRelayWsUrl(typeof opts.stored === 'string' ? opts.stored : '')
  if (isMpWeixinDevtools()) {
    if (saved && /localhost|127\.0\.0\.1/i.test(saved)) return saved
    return RELAY_WS_LOCAL
  }
  if (saved) return saved
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return RELAY_WS_LOCAL
    }
    return `ws://${host}:${RELAY_PORT}`
  }
  return RELAY_WS_LOCAL
}

/**
 * 从 /relay-info 解析可用于真机的 WS 列表（优先局域网 IP）
 * @param {Record<string, unknown>} info
 */
export function pickRelayWsUrlsFromInfo(info) {
  if (!info || typeof info !== 'object') return []
  const port = Number(info.port) || RELAY_PORT
  const urls = []
  if (Array.isArray(info.wsUrls)) {
    for (const u of info.wsUrls) {
      const n = normalizeRelayWsUrl(String(u))
      if (n && !urls.includes(n)) urls.push(n)
    }
  }
  if (Array.isArray(info.lanHosts)) {
    for (const h of info.lanHosts) {
      const host = String(h).trim()
      if (!host) continue
      const n = normalizeRelayWsUrl(host, port)
      if (n && !urls.includes(n)) urls.push(n)
    }
  }
  return urls
}

/** 真机联调优先选非 localhost 的 WS */
export function pickRelayWsForMobileDevice(urls) {
  const list = (urls || []).map((u) => normalizeRelayWsUrl(u)).filter(Boolean)
  const lan = list.find((u) => !/localhost|127\.0\.0\.1/i.test(u))
  return lan || list[0] || ''
}
