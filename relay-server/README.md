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

## 协议概要

- 连接后须先发送 `join`（15 秒内），否则断开。
- **大屏（display）**：`{"type":"join","role":"display"}` → 返回 `joined`（含新建 `roomId`、`token`、`state`）。
- **小程序（mobile）**：`{"type":"join","role":"mobile","roomId":"...","token":"..."}` → `joined`。
- **命令**：`{"type":"command","name":"pause","payload":{}}` 等；成功则向房间内所有连接广播 `state`。

命令名与负载与仓库外参考项目 control-screen 对齐，并增加 **`setPlan`**：

`{"type":"command","name":"setPlan","payload":{"plan":[{"id":"1","title":"热身","durationMin":5,"videoUrl":"https://..."}],"currentItemId":"1"}}`

## 局域网与小程序

- 大屏浏览器、中继、手机需能互通：中继监听 `0.0.0.0`，用机器局域网 IP 访问（如 `ws://192.168.1.10:3456`）。
- 小程序 `uni.connectSocket` 的地址须在小程序后台配置为 **socket 合法域名**；生产环境请使用 **wss** 与已备案域名。
- REST `BASE_URL`（admin-api）与中继往往**不同端口**，分别配置即可。
