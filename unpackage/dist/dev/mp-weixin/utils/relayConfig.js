"use strict";
const RELAY_WS_REMOTE = "ws://10.112.189.54:3456";
const RELAY_ROOM_ID_DEFAULT = "1001";
const RELAY_TOKEN_DEFAULT = "2002";
const RELAY_STORAGE_KEYS = {
  ws: "relayWs",
  roomId: "relayRoomId",
  token: "relayToken"
};
function resolveRelayWsUrl(stored) {
  const saved = typeof stored === "string" ? stored.trim() : "";
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `ws://${host}:3456`;
    }
  }
  return saved || RELAY_WS_REMOTE;
}
exports.RELAY_ROOM_ID_DEFAULT = RELAY_ROOM_ID_DEFAULT;
exports.RELAY_STORAGE_KEYS = RELAY_STORAGE_KEYS;
exports.RELAY_TOKEN_DEFAULT = RELAY_TOKEN_DEFAULT;
exports.resolveRelayWsUrl = resolveRelayWsUrl;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/relayConfig.js.map
