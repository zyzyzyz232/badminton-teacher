<template>
  <view class="page">
    <view v-if="!socketJoined" class="card status-card">
      <view class="conn-badge" :class="phaseClass">{{ phaseLabel }}</view>
      <text v-if="statusLine" class="status">{{ statusLine }}</text>
      <button
        v-if="!connecting && connectionPhase !== 'open'"
        class="btn primary retry-btn"
        @click="handleConnect"
      >
        重新连接大屏
      </button>
    </view>

    <view class="card debug-card">
      <view class="debug-head" @click="showDebug = !showDebug">
        <text class="card-title">连接调试</text>
        <text class="debug-toggle">{{ showDebug ? '收起' : '展开' }}</text>
      </view>
      <view v-if="showDebug" class="debug-body">
        <text class="debug-tip">Web 端 WS 填电脑局域网 IP；手机勿用 127.0.0.1</text>
        <view class="debug-actions">
          <button class="btn small" @click="clearDebugLogs">清空日志</button>
          <button class="btn small" :disabled="!socketJoined" @click="sendPingState">拉取状态</button>
        </view>
        <scroll-view scroll-y class="debug-log" :scroll-top="logScrollTop">
          <view v-for="(row, i) in debugLogs" :key="i" class="log-row" :class="'log-' + row.level">
            <text class="log-time">{{ row.time }}</text>
            <text class="log-tag">{{ row.tag }}</text>
            <text class="log-msg">{{ row.msg }}</text>
          </view>
          <text v-if="!debugLogs.length" class="log-empty">暂无日志，进入页面后将自动连接</text>
        </scroll-view>
      </view>
    </view>

    <view v-if="socketJoined" class="card">
      <text class="card-title">计划 · {{ planTitle }}</text>
      <text class="hint">已下发 {{ planCount }} 个训练项</text>
      <button class="btn" :disabled="loadingPlan" @click="pushSetPlan">
        {{ loadingPlan ? '加载中…' : '重新下发计划' }}
      </button>
    </view>

    <view v-if="socketJoined && planIds.length" class="card">
      <text class="card-title">训练控制</text>
      <view class="row">
        <button class="btn small" @click="sendCmd('resume')">开始</button>
        <button class="btn small" @click="sendCmd('pause')">暂停</button>
        <button class="btn small" @click="sendCmd('resetBlockTimer')">重置本项计时</button>
      </view>
      <view class="row">
        <button class="btn small" :disabled="currentIndex <= 0" @click="shiftItem(-1)">上一项</button>
        <button
          class="btn small"
          :disabled="currentIndex >= planIds.length - 1"
          @click="shiftItem(1)"
        >
          下一项
        </button>
      </view>
      <view class="row">
        <button class="btn small" @click="toggleVideo">视频 开/关</button>
        <button class="btn small danger" @click="endTraining">结束训练</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isH5Client } from '../../utils/platform.js'
import {
  resolveRelayWsUrl,
  RELAY_ROOM_ID_DEFAULT,
  RELAY_TOKEN_DEFAULT,
  RELAY_STORAGE_KEYS,
} from '../../utils/relayConfig.js'

const BASE_URL = 'http://10.112.189.54:48080/admin-api'

const relayWs = ref(resolveRelayWsUrl())
const roomId = ref(RELAY_ROOM_ID_DEFAULT)
const token = ref(RELAY_TOKEN_DEFAULT)
const connecting = ref(false)
const socketJoined = ref(false)
const socketOpen = ref(false)
const statusLine = ref('')
const showDebug = ref(false)
const debugLogs = ref([])
const logScrollTop = ref(0)

const connectionPhase = computed(() => {
  if (socketJoined.value) return 'joined'
  if (connecting.value && socketOpen.value) return 'open'
  if (connecting.value) return 'connecting'
  return 'idle'
})

const phaseLabel = computed(() => {
  const map = {
    idle: '未连接',
    connecting: '握手中…',
    open: '已握手，等待 joined',
    joined: '已加入房间',
  }
  return map[connectionPhase.value] || '未知'
})

const phaseClass = computed(() => `phase-${connectionPhase.value}`)

function pad2(n) {
  return String(n).padStart(2, '0')
}

function nowStr() {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function pushLog(level, tag, msg, detail) {
  const row = { level, tag, msg, time: nowStr() }
  if (detail !== undefined) {
    try {
      row.msg += ` ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`
    } catch {
      row.msg += ' [detail]'
    }
  }
  debugLogs.value.push(row)
  if (debugLogs.value.length > 80) debugLogs.value.shift()
  logScrollTop.value = debugLogs.value.length * 999
  console.log(`[screen-control][${tag}]`, msg, detail ?? '')
}

function clearDebugLogs() {
  debugLogs.value = []
  logScrollTop.value = 0
}

const DIGITS4 = /^\d{4}$/

function normalizeDigits4(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 4)
}

function normalizeRoomFields() {
  roomId.value = normalizeDigits4(roomId.value)
  token.value = normalizeDigits4(token.value)
  persistRelayCredentials()
}

function loadRelayCredentials() {
  const savedWs = uni.getStorageSync(RELAY_STORAGE_KEYS.ws)
  const savedRoom = uni.getStorageSync(RELAY_STORAGE_KEYS.roomId)
  const savedToken = uni.getStorageSync(RELAY_STORAGE_KEYS.token)
  relayWs.value = resolveRelayWsUrl(typeof savedWs === 'string' ? savedWs : '')
  roomId.value = normalizeDigits4(
    typeof savedRoom === 'string' && savedRoom ? savedRoom : RELAY_ROOM_ID_DEFAULT,
  )
  token.value = normalizeDigits4(
    typeof savedToken === 'string' && savedToken ? savedToken : RELAY_TOKEN_DEFAULT,
  )
}

function persistRelayCredentials() {
  try {
    const ws = relayWs.value.trim()
    if (ws) uni.setStorageSync(RELAY_STORAGE_KEYS.ws, ws)
    if (DIGITS4.test(roomId.value)) uni.setStorageSync(RELAY_STORAGE_KEYS.roomId, roomId.value)
    if (DIGITS4.test(token.value)) uni.setStorageSync(RELAY_STORAGE_KEYS.token, token.value)
  } catch {
    /* noop */
  }
}

function canAutoConnect() {
  return (
    planId.value > 0 &&
    !socketJoined.value &&
    !connecting.value &&
    !!relayWs.value.trim() &&
    DIGITS4.test(roomId.value) &&
    DIGITS4.test(token.value)
  )
}

const lessonId = ref(0)
const planId = ref(0)
const planTitle = ref('')

const loadingPlan = ref(false)
const planIds = ref([])
const currentIndex = ref(0)
const planCount = computed(() => planIds.value.length)

const getToken = () => uni.getStorageSync('token') || ''

/** GET 参数拼进 URL，避免 data 里 number 被序列化时精度/偏移（如 itemId 少 1） */
function buildUrlWithQuery(url, query) {
  const parts = []
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null || v === '') continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `${url}?${parts.join('&')}` : url
}

const requestGet = (url, data) =>
  new Promise((resolve, reject) => {
    uni.request({
      url: data ? buildUrlWithQuery(url, data) : url,
      method: 'GET',
      header: {
        Authorization: `Bearer ${getToken()}`,
        'Tenant-Id': '1',
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data?.code === 0) resolve(res.data.data || [])
        else reject(new Error(res.data?.msg || '请求失败'))
      },
      fail: reject,
    })
  })

/** list-by-plan 返回的项目 id，与资料管理页 itemId 一致（勿用 sortOrder / 数组下标） */
function resolveProjectItemId(project) {
  if (!project || typeof project !== 'object') return ''
  const raw =
    project.itemId != null && project.itemId !== '' ? project.itemId : project.id
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  if (!s || s === 'undefined' || s === 'null') return ''
  return s
}

function comparePlanProjects(a, b) {
  const ao = a.sortOrder
  const bo = b.sortOrder
  if (ao != null && bo != null && Number(ao) !== Number(bo)) {
    return Number(ao) - Number(bo)
  }
  const ai = resolveProjectItemId(a)
  const bi = resolveProjectItemId(b)
  return ai.localeCompare(bi, undefined, { numeric: true })
}

function mapProjectToPlanItem(project, materials) {
  const ms = [...(materials || [])].sort(
    (a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id),
  )
  const m = ms.find((row) => typeof row.videoUrl === 'string' && row.videoUrl) || ms[0] || {}
  const videoUrl = typeof m.videoUrl === 'string' && m.videoUrl ? m.videoUrl : undefined
  const desc = m.description || m.title
  const instruction = typeof desc === 'string' && desc ? desc : undefined
  const pid = resolveProjectItemId(project)
  const row = {
    id: pid || String(project.id ?? ''),
    title: project.itemName || `项目${pid || project.id}`,
    durationMin: Math.max(1, Math.round(Number(project.duration)) || 1),
  }
  if (videoUrl) row.videoUrl = videoUrl
  if (instruction) row.instruction = instruction
  return row
}

/** list-by-plan 取项目 → 每项 list-by-item(planId + itemId=项目 id) 取资料 */
async function fetchPlanPayloadForScreen(pid) {
  const projects = await requestGet(`${BASE_URL}/teaching/plan-project/list-by-plan`, {
    planId: pid,
  })
  const sorted = [...projects].sort(comparePlanProjects)
  const plan = await Promise.all(
    sorted.map(async (p) => {
      const itemId = resolveProjectItemId(p)
      let materials = []
      if (itemId) {
        try {
          materials = await requestGet(`${BASE_URL}/teaching/plan-material/list-by-item`, {
            planId: String(pid),
            itemId,
          })
          pushLog('info', 'MATERIAL', `list-by-item planId=${pid} itemId=${itemId}`)
        } catch {
          materials = []
        }
      }
      return mapProjectToPlanItem(p, materials)
    }),
  )
  return plan
}

function sendRaw(obj) {
  pushLog('out', 'SEND', obj.type || 'raw', obj)
  try {
    uni.sendSocketMessage({ data: JSON.stringify(obj) })
  } catch (e) {
    statusLine.value = '发送失败'
    pushLog('error', 'SEND', '发送失败', e?.message || String(e))
    console.error(e)
  }
}

function sendPingState() {
  pushLog('info', 'TEST', '等待服务端 state 广播（下发计划或操控后会收到）')
}

function sendCmd(name, payload) {
  sendRaw({ type: 'command', name, payload })
}

function onSocketMessageHandler(res) {
  pushLog('in', 'RECV', 'raw', res.data)
  try {
    const msg = JSON.parse(res.data)
    if (msg.type === 'joined') {
      socketJoined.value = true
      connecting.value = false
      statusLine.value = '已加入房间'
      pushLog('ok', 'JOINED', `roomId=${msg.roomId}`, msg)
      persistRelayCredentials()
      const authTok = getToken()
      if (authTok) {
        sendCmd('setMediaAuth', { token: authTok, tenantId: '1' })
        pushLog('out', 'setMediaAuth', '已同步视频访问令牌')
      }
      void pushSetPlan()
      return
    }
    if (msg.type === 'state' && msg.state?.plan?.length) {
      planIds.value = msg.state.plan.map((p) => p.id)
      const idx = msg.state.plan.findIndex((p) => p.id === msg.state.currentItemId)
      if (idx >= 0) currentIndex.value = idx
      const cur = msg.state.plan.find((p) => p.id === msg.state.currentItemId) || msg.state.plan[0]
      const hasToken = !!(msg.state.mediaBearerToken && String(msg.state.mediaBearerToken).length)
      pushLog('info', 'STATE', `plan=${msg.state.plan.length} paused=${msg.state.paused} videoPlaying=${msg.state.videoPlaying}`)
      pushLog('info', 'VIDEO', `token=${hasToken ? '有' : '无'} url=${cur?.videoUrl ? '有' : '无'}`, {
        videoUrl: cur?.videoUrl || '',
        tokenPrefix: hasToken ? String(msg.state.mediaBearerToken).slice(0, 8) : '',
      })
      return
    }
    if (msg.type === 'state') {
      pushLog('info', 'STATE', '状态更新', {
        paused: msg.state?.paused,
        currentItemId: msg.state?.currentItemId,
        videoPlaying: msg.state?.videoPlaying,
      })
      return
    }
    if (msg.type === 'error') {
      if (msg.code === 'unauthorized') {
        statusLine.value = '房间号或令牌错误，请核对4位数字'
      } else {
        statusLine.value = msg.message || msg.code || '错误'
      }
      connecting.value = false
      pushLog('error', 'ERROR', msg.message || msg.code, msg)
    }
  } catch {
    statusLine.value = '消息解析失败'
    pushLog('error', 'PARSE', '消息解析失败', res.data)
  }
}

function clearSocketListeners() {
  try {
    uni.offSocketOpen()
    uni.offSocketMessage()
    uni.offSocketError()
    uni.offSocketClose()
  } catch {
    /* noop */
  }
}

function bindSocketListeners() {
  uni.onSocketOpen(() => {
    socketOpen.value = true
    pushLog('ok', 'OPEN', relayWs.value.trim())
    sendRaw({
      type: 'join',
      role: 'mobile',
      roomId: roomId.value.trim(),
      token: token.value.trim(),
    })
  })
  uni.onSocketMessage(onSocketMessageHandler)
  uni.onSocketError((err) => {
    statusLine.value = 'WebSocket 错误'
    connecting.value = false
    socketOpen.value = false
    pushLog('error', 'WS_ERR', 'WebSocket 错误', err?.errMsg || err)
  })
  uni.onSocketClose((res) => {
    socketJoined.value = false
    connecting.value = false
    socketOpen.value = false
    statusLine.value = '连接已关闭'
    pushLog('warn', 'CLOSE', `code=${res?.code ?? '-'} reason=${res?.reason || '-'}`, res)
  })
}

function handleConnect() {
  if (socketJoined.value) return
  normalizeRoomFields()
  if (!relayWs.value.trim()) {
    uni.showToast({ title: '请填写 WS 地址', icon: 'none' })
    return
  }
  if (!DIGITS4.test(roomId.value) || !DIGITS4.test(token.value)) {
    uni.showToast({ title: '房间号与令牌均为4位数字', icon: 'none' })
    return
  }
  persistRelayCredentials()
  statusLine.value = ''
  connecting.value = true
  socketOpen.value = false
  pushLog('info', 'CONNECT', relayWs.value.trim(), {
    roomId: roomId.value,
    token: token.value,
  })
  try {
    uni.closeSocket()
  } catch {
    /* noop */
  }
  clearSocketListeners()
  bindSocketListeners()
  uni.connectSocket({
    url: relayWs.value.trim(),
    fail: (err) => {
      connecting.value = false
      socketOpen.value = false
      statusLine.value = '无法发起连接'
      pushLog('error', 'CONNECT', '无法发起连接', err?.errMsg || err)
      console.error(err)
    },
  })
}

async function pushSetPlan() {
  if (!planId.value) {
    uni.showToast({ title: '缺少 planId', icon: 'none' })
    return
  }
  loadingPlan.value = true
  try {
    const plan = await fetchPlanPayloadForScreen(planId.value)
    if (!plan.length) {
      uni.showToast({ title: '训练项为空', icon: 'none' })
      loadingPlan.value = false
      return
    }
    planIds.value = plan.map((p) => p.id)
    currentIndex.value = 0
    const mediaTok = getToken()
    const withVideo = plan.filter((p) => p.videoUrl).length
    sendCmd('setPlan', {
      plan,
      currentItemId: plan[0].id,
      mediaBearerToken: mediaTok,
    })
    pushLog('out', 'setPlan', `下发 ${plan.length} 项，含视频 ${withVideo} 项`, {
      currentItemId: plan[0].id,
      videoUrl: plan[0].videoUrl || '(无)',
      hasMediaToken: !!mediaTok,
      tokenPrefix: mediaTok ? mediaTok.slice(0, 8) : '',
    })
    uni.showToast({ title: '计划已下发', icon: 'success' })
  } catch (e) {
    console.error(e)
    uni.showToast({ title: e.message || '加载计划失败', icon: 'none' })
  } finally {
    loadingPlan.value = false
  }
}

function shiftItem(delta) {
  const next = currentIndex.value + delta
  if (next < 0 || next >= planIds.value.length) return
  currentIndex.value = next
  sendCmd('setCurrentItem', { id: planIds.value[next] })
}

function toggleVideo() {
  sendCmd('toggleVideo')
  pushLog('out', 'toggleVideo', '已发送 视频开/关（大屏 videoPlaying 将切换）')
}

function endTraining() {
  sendCmd('pause')
  sendCmd('setVideoPlaying', { playing: false })
}

onMounted(() => {
  const pages = getCurrentPages()
  const opts = pages[pages.length - 1]?.options || {}
  lessonId.value = parseInt(opts.lessonId, 10) || 0
  planId.value = parseInt(opts.planId, 10) || 0
  planTitle.value = decodeURIComponent(opts.planTitle || '')

  if (isH5Client() && (!planId.value || planId.value <= 0)) {
    uni.showToast({ title: '请从「选择训练计划」进入遥控', icon: 'none', duration: 2500 })
    setTimeout(() => {
      const token = uni.getStorageSync('token')
      if (token) uni.switchTab({ url: '/pages/home/home' })
      else uni.reLaunch({ url: '/pages/index/index' })
    }, 400)
    return
  }

  loadRelayCredentials()
  if (!uni.getStorageSync(RELAY_STORAGE_KEYS.roomId)) {
    persistRelayCredentials()
  }
  uni.setNavigationBarTitle({ title: '大屏遥控' })
  pushLog('info', 'INIT', `planId=${planId.value} ws=${relayWs.value} room=${roomId.value}`)
  if (canAutoConnect()) {
    setTimeout(() => {
      if (canAutoConnect()) handleConnect()
    }, 400)
  }
})

onUnmounted(() => {
  clearSocketListeners()
  try {
    uni.closeSocket()
  } catch {
    /* noop */
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24rpx;
  padding-bottom: 80rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16rpx;
}

.retry-btn {
  margin-top: 8rpx;
  width: 100%;
}
.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}
.field {
  margin-bottom: 20rpx;
}
.label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}
.input {
  border: 1px solid #e5e5e5;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
}
.code-input {
  font-family: ui-monospace, monospace;
  font-size: 36rpx;
  letter-spacing: 0.2em;
  text-align: center;
}
.field-hint {
  display: block;
  font-size: 22rpx;
  color: #d48806;
  line-height: 1.5;
  margin-top: -8rpx;
  margin-bottom: 8rpx;
}
.btn {
  margin-top: 12rpx;
  background: #f0f0f0;
  color: #333;
  font-size: 28rpx;
}
.btn.primary {
  background: #07c160;
  color: #fff;
}
.btn.small {
  margin: 8rpx 8rpx 0 0;
  font-size: 26rpx;
  padding: 12rpx 20rpx;
}
.btn.danger {
  background: #fff1f0;
  color: #cf1322;
}
.row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8rpx;
}
.status {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #888;
}
.hint {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}
.conn-badge {
  display: inline-block;
  margin-top: 16rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: bold;
}
.phase-idle {
  background: #f5f5f5;
  color: #999;
}
.phase-connecting {
  background: #fff7e6;
  color: #d48806;
}
.phase-open {
  background: #e6f7ff;
  color: #096dd9;
}
.phase-joined {
  background: #f6ffed;
  color: #389e0d;
}
.debug-card {
  padding-bottom: 16rpx;
}
.debug-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.debug-head .card-title {
  margin-bottom: 0;
}
.debug-toggle {
  font-size: 24rpx;
  color: #07c160;
}
.debug-body {
  margin-top: 16rpx;
}
.debug-tip {
  display: block;
  font-size: 22rpx;
  color: #d48806;
  margin-bottom: 12rpx;
  line-height: 1.5;
}
.debug-actions {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}
.debug-log {
  max-height: 360rpx;
  background: #1e1e1e;
  border-radius: 8rpx;
  padding: 12rpx;
}
.log-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 8rpx;
  font-size: 20rpx;
  line-height: 1.4;
  word-break: break-all;
}
.log-time {
  color: #888;
  flex-shrink: 0;
}
.log-tag {
  color: #61dafb;
  flex-shrink: 0;
  font-weight: bold;
}
.log-msg {
  color: #ddd;
  flex: 1;
}
.log-out .log-tag {
  color: #98c379;
}
.log-in .log-tag {
  color: #e5c07b;
}
.log-ok .log-tag {
  color: #98c379;
}
.log-error .log-tag,
.log-error .log-msg {
  color: #e06c75;
}
.log-warn .log-tag {
  color: #d19a66;
}
.log-empty {
  font-size: 22rpx;
  color: #888;
}
</style>
