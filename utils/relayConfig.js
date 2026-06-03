/**
 * 大屏中继连接默认配置（与 gym_screen 的 .env 中 VITE_RELAY_* 保持一致）
 * 部署到机房服务器时，将 RELAY_WS_REMOTE 改为该机局域网 IP。
 */
export const RELAY_WS_REMOTE = 'ws://10.112.189.54:3456'
export const RELAY_WS_LOCAL = 'ws://127.0.0.1:3456'

export const RELAY_ROOM_ID_DEFAULT = '1001'
export const RELAY_TOKEN_DEFAULT = '2002'

/** @deprecated 使用 resolveRelayWsUrl() */
export const RELAY_WS_DEFAULT = RELAY_WS_REMOTE

export const RELAY_STORAGE_KEYS = {
  ws: 'relayWs',
  roomId: 'relayRoomId',
  token: 'relayToken',
}

/**
 * H5 在 localhost 开发时连本机中继；否则用已保存地址或远端默认。
 * 本机联调时教师端请用 http://localhost:5174，勿用 10.112.189.54 打开 H5。
 * @param {string} [stored] uni.getStorageSync('relayWs')
 */
export function resolveRelayWsUrl(stored) {
  const saved = typeof stored === 'string' ? stored.trim() : ''
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return `ws://${host}:3456`
    }
  }
  return saved || RELAY_WS_REMOTE
}
