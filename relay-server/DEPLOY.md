# 中继 relay-server 部署说明

固定房间 **1001** / 令牌 **2002**，仅 **protocol v2**（本仓库 `relay-server`）支持。

## 如何判断「本机已新、机房仍旧」

| 检测 | 本机 `127.0.0.1:3456` | 机房 `10.112.189.54:3456` |
|------|----------------------|---------------------------|
| `npm run verify` | OK | — |
| `npm run verify:remote` | — | **FAIL（旧版 WS）** |
| 大屏 FALLBACK 后 JOINED | 是 | 否 |

**结论**：你在开发机上跑的是新版中继；**10.112.189.54 上 3456 端口的 WebSocket 仍是旧程序**。  
本机 `netstat` 里看到的 PID 14408 只代表**本机**在监听，不能代替机房部署。

---

## 本机联调（当前推荐）

1. 本机启动中继：
   ```bash
   cd relay-server
   npm run dev
   ```
   日志须含：`relay-2026-v2 protocol v2 pinned room 1001/2002`

2. `gym_screen/.env.development` 已默认：
   ```env
   VITE_RELAY_WS=ws://127.0.0.1:3456
   ```
   重启 `npm run dev` 后刷新大屏。

3. 教师 H5 必须用 **`http://localhost:5174`**（会自动连 `ws://localhost:3456`）。  
   **不要**用 `http://10.112.189.54:xxxx` 打开教师端，否则会连到机房旧中继。

4. 验证本机：
   ```bash
   npm run verify
   ```
   应输出 `[verify] OK 新版 join 成功`。

---

## 在机房 10.112.189.54 上部署（生产 / 课堂）

须 **登录到 10.112.189.54 这台机器**（远程桌面或 SSH），在本机开发机上 `npm run dev` **不会**更新机房端口。

```powershell
# 在 10.112.189.54 上执行
netstat -ano | findstr :3456
taskkill /PID <旧PID> /F

cd <把本仓库 relay-server 拷到服务器上的路径>
npm install
npm run build
npm start
```

成功日志示例：

```text
[relay] relay-2026-v2 protocol v2 pinned room 1001/2002
[relay] WebSocket listening on 0.0.0.0:3456
```

**在服务器上**验证（比只开浏览器看 relay-info 更可靠）：

```powershell
curl http://127.0.0.1:3456/relay-info
# 应含 "protocol":2  "build":"relay-2026-v2"

cd relay-server
npm run verify
# 应 OK
```

在你开发机上再测：

```bash
npm run verify:remote
# 应 OK；若仍 FAIL，说明防火墙/NAT 把 3456 指到了别的机器，或旧进程未杀净
```

部署成功后，再把 `gym_screen/.env.development`（或生产环境变量）改回：

```env
VITE_RELAY_WS=ws://10.112.189.54:3456
```

---

## 常见误区

1. **本机 relay-info 正常 ≠ 机房已更新** — 你访问的可能是本机 3456。
2. **HTTP /relay-info 正常 ≠ WS 已更新** — 必须用 `npm run verify:remote` 测 join。
3. **大屏连本机、教师连机房** — 两个中继，计划/视频无法同步。
4. 旧版 join 错误文案：`房间不存在或令牌错误`（无「请先启动大屏…」后缀）。
