import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { applyCommand, createInitialState, parseWireCommand, tickState, } from './stateLogic.js';
const PORT = Number(process.env.PORT ?? 3456);
const rooms = new Map();
const meta = new Map();
const DIGITS4 = /^\d{4}$/;
function normalizeCode(value) {
    return String(value ?? '').replace(/\D/g, '').slice(0, 4);
}
const PINNED_ROOM_ID = normalizeCode(process.env.RELAY_PINNED_ROOM_ID ?? '1001');
const PINNED_TOKEN = normalizeCode(process.env.RELAY_PINNED_TOKEN ?? '2002');
function ensurePinnedRoom() {
    if (!DIGITS4.test(PINNED_ROOM_ID) || !DIGITS4.test(PINNED_TOKEN)) {
        console.warn('[relay] 跳过预置房间：RELAY_PINNED_ROOM_ID / RELAY_PINNED_TOKEN 须为 4 位数字');
        return;
    }
    if (rooms.has(PINNED_ROOM_ID))
        return;
    rooms.set(PINNED_ROOM_ID, {
        id: PINNED_ROOM_ID,
        token: PINNED_TOKEN,
        state: createInitialState(),
        clients: new Set(),
    });
    console.log(`[relay] 预置房间 roomId=${PINNED_ROOM_ID} token=${PINNED_TOKEN}`);
}
function randomDigits4() {
    const n = randomBytes(2).readUInt16BE(0) % 10000;
    return String(n).padStart(4, '0');
}
function randomRoomId() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const id = randomDigits4();
        if (!rooms.has(id))
            return id;
    }
    throw new Error('[relay] no available room id');
}
function randomToken() {
    return randomDigits4();
}
function send(ws, msg) {
    if (ws.readyState === ws.OPEN)
        ws.send(JSON.stringify(msg));
}
function broadcastRoom(room) {
    const msg = { type: 'state', state: room.state };
    const raw = JSON.stringify(msg);
    for (const c of room.clients) {
        if (c.readyState === c.OPEN)
            c.send(raw);
    }
}
function getRoom(id) {
    return rooms.get(id);
}
function deleteRoomIfEmpty(room) {
    if (room.clients.size === 0)
        rooms.delete(room.id);
}
function attachClient(ws, room) {
    room.clients.add(ws);
    const m = meta.get(ws);
    if (m)
        m.roomId = room.id;
}
function detachClient(ws) {
    const m = meta.get(ws);
    if (!m?.roomId)
        return;
    const room = rooms.get(m.roomId);
    if (room) {
        room.clients.delete(ws);
        deleteRoomIfEmpty(room);
    }
    m.roomId = null;
    m.role = null;
}
function joinRoomWithCredentials(ws, role, roomId, token, createIfMissing) {
    const m = meta.get(ws);
    if (!DIGITS4.test(roomId) || !DIGITS4.test(token)) {
        send(ws, { type: 'error', code: 'bad_join', message: '房间号与令牌均为4位数字' });
        return;
    }
    let room = getRoom(roomId);
    if (!room) {
        if (!createIfMissing) {
            send(ws, {
                type: 'error',
                code: 'unauthorized',
                message: '房间不存在或令牌错误，请先启动大屏或确认中继已重启',
            });
            return;
        }
        room = {
            id: roomId,
            token,
            state: createInitialState(),
            clients: new Set(),
        };
        rooms.set(room.id, room);
    }
    else if (room.token !== token) {
        send(ws, { type: 'error', code: 'unauthorized', message: '房间号已占用且令牌不匹配' });
        return;
    }
    attachClient(ws, room);
    m.roomId = room.id;
    m.role = role;
    send(ws, {
        type: 'joined',
        roomId: room.id,
        token: room.token,
        role,
        state: room.state,
    });
}
function handleJoin(ws, msg) {
    const m = meta.get(ws);
    if (m.roomId) {
        send(ws, { type: 'error', code: 'already_joined', message: '已加入房间' });
        return;
    }
    const role = String(msg.role ?? '').toLowerCase();
    const roomId = normalizeCode(msg.roomId);
    const token = normalizeCode(msg.token);
    if (role === 'display') {
        if (roomId && token) {
            joinRoomWithCredentials(ws, 'display', roomId, token, true);
            return;
        }
        const id = randomRoomId();
        const randomTok = randomToken();
        const room = {
            id,
            token: randomTok,
            state: createInitialState(),
            clients: new Set(),
        };
        rooms.set(id, room);
        attachClient(ws, room);
        m.role = 'display';
        send(ws, {
            type: 'joined',
            roomId: id,
            token: randomTok,
            role: 'display',
            state: room.state,
        });
        return;
    }
    if (role === 'mobile') {
        if (!roomId || !token) {
            send(ws, { type: 'error', code: 'bad_join', message: '缺少房间号或令牌' });
            return;
        }
        joinRoomWithCredentials(ws, 'mobile', roomId, token, true);
        return;
    }
    send(ws, { type: 'error', code: 'bad_role', message: `未知角色: ${msg.role ?? '(空)'}` });
}
function handleCommand(ws, msg) {
    const m = meta.get(ws);
    if (!m?.roomId) {
        send(ws, { type: 'error', code: 'not_joined', message: '未加入房间' });
        return;
    }
    const room = getRoom(m.roomId);
    if (!room) {
        send(ws, { type: 'error', code: 'room_missing', message: '房间已失效' });
        return;
    }
    const cmd = parseWireCommand(msg.name, msg.payload);
    if (!cmd) {
        send(ws, { type: 'error', code: 'bad_command', message: '未知命令' });
        return;
    }
    room.state = applyCommand(room.state, cmd);
    broadcastRoom(room);
}
const wss = new WebSocketServer({ noServer: true });
const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>Relay Server</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;line-height:1.6">
  <h1>中继服务运行中</h1>
  <p>端口 <code>${PORT}</code> 是 <strong>WebSocket</strong> 中继，不是网页地址。</p>
  <p>浏览器直接打开会显示 <code>Upgrade Required</code>，这是正常现象。</p>
  <h2>正确用法</h2>
  <ol>
    <li>保持本中继运行（当前页面说明服务已启动）</li>
    <li>在 <code>gym_screen</code> 目录执行 <code>npm run dev</code></li>
    <li>浏览器打开大屏前端（通常 <a href="http://localhost:5173">http://localhost:5173</a>）</li>
    <li>小程序/遥控端连接 <code>ws://localhost:${PORT}</code>（手机请改用局域网 IP）</li>
  </ol>
  <p>WebSocket 地址：<code>ws://localhost:${PORT}</code></p>
</body>
</html>`);
        return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
});
server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
    });
});
server.listen(PORT, '0.0.0.0', () => {
    ensurePinnedRoom();
    console.log(`[relay] WebSocket listening on 0.0.0.0:${PORT} (e.g. ws://localhost:${PORT} or ws://<LAN-IP>:${PORT})`);
    console.log(`[relay] HTTP health check: http://localhost:${PORT}/`);
});
wss.on('connection', (ws) => {
    meta.set(ws, { ws, roomId: null, role: null });
    const joinTimer = setTimeout(() => {
        const m = meta.get(ws);
        if (m && !m.roomId) {
            send(ws, { type: 'error', code: 'join_timeout', message: '连接超时，请先发送 join' });
            ws.close();
        }
    }, 15000);
    ws.on('message', (raw) => {
        let data;
        try {
            data = JSON.parse(String(raw));
        }
        catch {
            send(ws, { type: 'error', code: 'bad_json', message: '无效 JSON' });
            return;
        }
        if (data.type === 'join') {
            clearTimeout(joinTimer);
            handleJoin(ws, data);
            return;
        }
        if (data.type === 'command') {
            handleCommand(ws, data);
        }
    });
    ws.on('close', () => {
        clearTimeout(joinTimer);
        detachClient(ws);
        meta.delete(ws);
    });
});
setInterval(() => {
    for (const room of rooms.values()) {
        const next = tickState(room.state);
        if (next === room.state)
            continue;
        room.state = next;
        broadcastRoom(room);
    }
}, 1000);
