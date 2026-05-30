import { randomBytes } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { applyCommand, createInitialState, parseWireCommand, tickState, } from './stateLogic.js';
const PORT = Number(process.env.PORT ?? 3456);
const rooms = new Map();
const meta = new Map();
function randomId(len = 8) {
    return randomBytes(len).toString('base64url').slice(0, len).toUpperCase();
}
function randomToken() {
    return randomBytes(24).toString('hex');
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
function handleJoin(ws, msg) {
    const m = meta.get(ws);
    if (m.roomId) {
        send(ws, { type: 'error', code: 'already_joined', message: '已加入房间' });
        return;
    }
    if (msg.role === 'display' && !msg.roomId) {
        const id = randomId(8);
        const token = randomToken();
        const room = {
            id,
            token,
            state: createInitialState(),
            clients: new Set([ws]),
        };
        rooms.set(id, room);
        m.roomId = id;
        m.role = 'display';
        send(ws, {
            type: 'joined',
            roomId: id,
            token,
            role: 'display',
            state: room.state,
        });
        return;
    }
    if (!msg.roomId || !msg.token) {
        send(ws, { type: 'error', code: 'bad_join', message: '缺少房间或令牌' });
        return;
    }
    const room = getRoom(msg.roomId);
    if (!room || room.token !== msg.token) {
        send(ws, { type: 'error', code: 'unauthorized', message: '房间不存在或令牌错误' });
        return;
    }
    attachClient(ws, room);
    m.role = msg.role;
    send(ws, {
        type: 'joined',
        roomId: room.id,
        token: room.token,
        role: msg.role,
        state: room.state,
    });
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
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });
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
console.log(`[relay] WebSocket listening on 0.0.0.0:${PORT} (e.g. ws://localhost:${PORT} or ws://<LAN-IP>:${PORT})`);
