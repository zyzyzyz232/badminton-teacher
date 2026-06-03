# Relay server（小程序 ↔ gym_screen 大屏）

独立 WebSocket 中继：房间、`SessionState`、每秒 tick（暂停时不推进总/块计时）、`setPlan` 与遥控命令广播给房间内所有客户端。

## 启动

```bash
cd relay-server
npm install
npm run build
npm start
```

开发（热重载）：

```bash
npm run dev
```

默认端口 **3456**，可通过环境变量覆盖：

```bash
set PORT=4000
npm start
```

浏览器访问 `http://localhost:3456` 会显示中继状态说明页（**不是大屏界面**）。大屏请启动 `gym_screen` 后打开 `http://localhost:5173`；**教师端 uni-app H5** 使用 `http://localhost:5174`（勿与 gym_screen 共用 5173）。WebSocket 客户端连接 `ws://localhost:3456`。

## 协议概要

- 连接后须先发送 `join`（15 秒内），否则断开。
- **大屏（display）**：`{"type":"join","role":"display"}` → 随机 **4 位** `roomId`/`token`；或固定房间 `{"type":"join","role":"display","roomId":"1001","token":"2002"}`（与 `gym_screen` `.env`、`relayConfig.js` 一致）。
- **小程序（mobile）**：`{"type":"join","role":"mobile","roomId":"1001","token":"2002"}` → `joined`。
- 启动时预置房间（默认 `1001`/`2002`），可用 `RELAY_PINNED_ROOM_ID`、`RELAY_PINNED_TOKEN` 覆盖。**修改逻辑后请 `npm run dev` 或 `npm run build && npm start` 重启中继。**
- **命令**：`{"type":"command","name":"pause","payload":{}}` 等；成功则向房间内所有连接广播 `state`。

命令名与负载与仓库外参考项目 control-screen 对齐，并增加 **`setPlan`**：

`{"type":"command","name":"setPlan","payload":{"plan":[{"id":"1","title":"热身","durationMin":5,"videoUrl":"https://..."}],"currentItemId":"1","mediaBearerToken":"<教师端 accessToken>"}}`

`mediaBearerToken` 用于中继 **`GET /media-proxy?roomId=1001&url=<编码后的视频地址>`** 代拉需登录的视频（大屏 `<video>` 无法自带 Authorization 头）。

## 局域网与小程序

- 大屏浏览器、中继、手机需能互通：中继监听 `0.0.0.0`，用机器局域网 IP 访问（如 `ws://192.168.1.10:3456`）。
- 小程序 `uni.connectSocket` 的地址须在小程序后台配置为 **socket 合法域名**；生产环境请使用 **wss** 与已备案域名。
- REST `BASE_URL`（admin-api）与中继往往**不同端口**，分别配置即可。
