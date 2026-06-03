/**
 * 大屏中继连接默认配置（与 gym_screen 的 .env 中 VITE_RELAY_* 保持一致）
 * 部署时按实际局域网 IP 与房间号修改此处即可。
 */
export const RELAY_WS_DEFAULT = 'ws://10.112.189.54:3456'
export const RELAY_ROOM_ID_DEFAULT = '1001'
export const RELAY_TOKEN_DEFAULT = '2002'

export const RELAY_STORAGE_KEYS = {
  ws: 'relayWs',
  roomId: 'relayRoomId',
  token: 'relayToken',
}
