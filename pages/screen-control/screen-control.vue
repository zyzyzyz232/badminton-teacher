<template>
  <view class="page">
    <!-- 顶部状态栏 -->
    <view class="header-bar" :class="{ connected: socketJoined }">
      <view class="header-content">
        <text class="header-title">{{ socketJoined ? '已连接大屏' : '大屏遥控' }}</text>
        <view class="conn-badge" :class="phaseClass">{{ phaseLabel }}</view>
      </view>
      <text v-if="statusLine" class="status-text">{{ statusLine }}</text>
    </view>

    <!-- 未连接时显示连接按钮 -->
    <view v-if="!socketJoined" class="connect-section">
      <view class="connect-icon">
        <text class="icon-rocket">🚀</text>
      </view>
      <text class="connect-hint">请确保大屏已开启并显示房间号</text>
      <button
        class="btn-connect"
        :disabled="connecting"
        @click="handleConnect"
      >
        <text class="btn-icon">📱</text>
        <text class="btn-text">{{ connecting ? '连接中…' : '连接大屏' }}</text>
      </button>
    </view>

    <!-- 已连接：计划信息 -->
    <view v-if="socketJoined" class="plan-section">
      <view class="plan-header">
        <text class="plan-title">{{ planTitle || '训练计划' }}</text>
        <text class="plan-count">共 {{ planCount }} 个训练项</text>
      </view>
      <button class="btn-refresh" :disabled="loadingPlan" @click="pushSetPlan">
        <text class="btn-icon">🔄</text>
        <text class="btn-text">{{ loadingPlan ? '加载中…' : '重新下发计划' }}</text>
      </button>
    </view>

    <!-- 已连接：训练控制面板 -->
    <view v-if="socketJoined && planIds.length" class="control-panel">
      <text class="panel-title">训练控制</text>
      
      <!-- 当前项目指示 -->
      <view class="current-item">
        <text class="current-label">当前项目</text>
        <text class="current-num">{{ currentIndex + 1 }} / {{ planCount }}</text>
      </view>

      <!-- 主控制按钮 -->
      <view class="control-main">
        <button class="ctrl-btn start" @click="sendCmd('resume')">
          <text class="ctrl-icon">▶</text>
          <text class="ctrl-text">开始</text>
        </button>
        <button class="ctrl-btn pause" @click="sendCmd('pause')">
          <text class="ctrl-icon">⏸</text>
          <text class="ctrl-text">暂停</text>
        </button>
      </view>

      <!-- 项目切换 -->
      <view class="control-nav">
        <button 
          class="ctrl-btn nav" 
          :disabled="currentIndex <= 0" 
          @click="shiftItem(-1)"
        >
          <text class="ctrl-icon">◀</text>
          <text class="ctrl-text">上一项</text>
        </button>
        <button 
          class="ctrl-btn nav" 
          :disabled="currentIndex >= planIds.length - 1" 
          @click="shiftItem(1)"
        >
          <text class="ctrl-text">下一项</text>
          <text class="ctrl-icon">▶</text>
        </button>
      </view>

      <!-- 辅助控制 -->
      <view class="control-aux">
        <button class="ctrl-btn aux" @click="sendCmd('resetBlockTimer')">
          <text class="ctrl-icon">⏱</text>
          <text class="ctrl-text">重置计时</text>
        </button>
        <button class="ctrl-btn aux" @click="toggleVideo">
          <text class="ctrl-icon">🎬</text>
          <text class="ctrl-text">视频开关</text>
        </button>
      </view>

      <!-- 结束训练 -->
      <button class="ctrl-btn danger" @click="endTraining">
        <text class="ctrl-icon">⏹</text>
        <text class="ctrl-text">结束训练</text>
      </button>
    </view>

    <!-- 调试面板（可折叠） -->
    <view class="debug-card">
      <view class="debug-head" @click="showDebug = !showDebug">
        <text class="debug-title">连接调试</text>
        <text class="debug-toggle">{{ showDebug ? '收起 ▲' : '展开 ▼' }}</text>
      </view>
      <view v-if="showDebug" class="debug-body">
        <view class="debug-actions">
          <button class="btn-small" @click="clearDebugLogs">清空日志</button>
          <button class="btn-small" :disabled="!socketJoined" @click="sendPingState">拉取状态</button>
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
  const videoMat = ms.find((row) => typeof row.videoUrl === 'string' && row.videoUrl)
  const imageMat = ms.find((row) => typeof row.imageUrl === 'string' && row.imageUrl)
  const m = videoMat || imageMat || ms[0] || {}
  const videoUrl = videoMat?.videoUrl || (typeof m.videoUrl === 'string' && m.videoUrl ? m.videoUrl : undefined)
  const imageUrl =
    imageMat?.imageUrl || (typeof m.imageUrl === 'string' && m.imageUrl ? m.imageUrl : undefined)
  const desc = (videoMat || imageMat || m).description || (videoMat || imageMat || m).title
  const instruction = typeof desc === 'string' && desc ? desc : undefined
  const pid = resolveProjectItemId(project)
  const row = {
    id: pid || String(project.id ?? ''),
    title: project.itemName || `项目${pid || project.id}`,
    durationMin: Math.max(1, Math.round(Number(project.duration)) || 1),
  }
  if (videoUrl) row.videoUrl = videoUrl
  if (imageUrl) row.imageUrl = imageUrl
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
      pushLog('info', 'VIDEO', `token=${hasToken ? '有' : '无'} video=${cur?.videoUrl ? '有' : '无'} image=${cur?.imageUrl ? '有' : '无'}`, {
        videoUrl: cur?.videoUrl || '',
        imageUrl: cur?.imageUrl || '',
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
    const withImage = plan.filter((p) => p.imageUrl).length
    sendCmd('setPlan', {
      plan,
      currentItemId: plan[0].id,
      mediaBearerToken: mediaTok,
    })
    pushLog('out', 'setPlan', `下发 ${plan.length} 项，视频 ${withVideo} / 图片 ${withImage}`, {
      currentItemId: plan[0].id,
      videoUrl: plan[0].videoUrl || '(无)',
      imageUrl: plan[0].imageUrl || '(无)',
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
  background: linear-gradient(180deg, #f0f4f8 0%, #e8f0f8 100%);
  padding: 0;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

/* 顶部状态栏 */
.header-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 32rpx 32rpx;
  position: relative;
  
  &.connected {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}

.status-text {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.conn-badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.phase-idle { background: rgba(255, 255, 255, 0.2); }
.phase-connecting { background: rgba(255, 193, 7, 0.4); }
.phase-open { background: rgba(33, 150, 243, 0.4); }
.phase-joined { background: rgba(76, 175, 80, 0.4); }

/* 连接区域 */
.connect-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
  margin: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.connect-icon {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(102, 126, 234, 0.4);
}

.icon-rocket {
  font-size: 72rpx;
}

.connect-hint {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
  text-align: center;
}

.btn-connect {
  width: 100%;
  height: 108rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 54rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  
  &[disabled] {
    opacity: 0.7;
  }
}

.btn-connect .btn-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.btn-connect .btn-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #fff;
}

/* 计划信息区 */
.plan-section {
  margin: 24rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.plan-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.plan-count {
  font-size: 26rpx;
  color: #666;
  background: #f0f4f8;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.btn-refresh {
  width: 100%;
  height: 88rpx;
  background: #f0f4f8;
  border-radius: 44rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &[disabled] {
    opacity: 0.6;
  }
}

.btn-refresh .btn-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.btn-refresh .btn-text {
  font-size: 30rpx;
  color: #333;
}

/* 控制面板 */
.control-panel {
  margin: 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.panel-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 24rpx;
}

.current-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 16rpx;
  margin-bottom: 28rpx;
}

.current-label {
  font-size: 28rpx;
  color: #388e3c;
}

.current-num {
  font-size: 32rpx;
  font-weight: bold;
  color: #2e7d32;
}

/* 控制按钮样式 */
.ctrl-btn {
  width: 100%;
  height: 108rpx;
  border-radius: 24rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  transition: all 0.2s;
  
  &[disabled] {
    opacity: 0.4;
  }
}

.ctrl-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.ctrl-text {
  font-size: 32rpx;
  font-weight: 600;
}

/* 主控制按钮 */
.control-main {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  .ctrl-btn {
    flex: 1;
  }
  
  .start {
    background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%);
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba(67, 160, 71, 0.35);
  }
  
  .pause {
    background: linear-gradient(135deg, #fb8c00 0%, #ffa726 100%);
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba(251, 140, 0, 0.35);
  }
}

/* 导航按钮 */
.control-nav {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  .ctrl-btn {
    flex: 1;
    background: #e3f2fd;
    color: #1565c0;
    
    &:not([disabled]):active {
      background: #bbdefb;
    }
  }
}

/* 辅助按钮 */
.control-aux {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  .ctrl-btn {
    flex: 1;
    height: 92rpx;
    background: #f5f5f5;
    color: #666;
    
    .ctrl-icon {
      font-size: 36rpx;
    }
    
    .ctrl-text {
      font-size: 28rpx;
    }
  }
}

/* 危险按钮 */
.ctrl-btn.danger {
  background: linear-gradient(135deg, #e53935 0%, #ef5350 100%);
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(229, 57, 53, 0.35);
  margin-top: 8rpx;
}

/* 调试面板 */
.debug-card {
  margin: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.debug-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  background: #fafafa;
}

.debug-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #666;
}

.debug-toggle {
  font-size: 26rpx;
  color: #1976d2;
}

.debug-body {
  padding: 20rpx;
}

.debug-actions {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.btn-small {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 26rpx;
  background: #f5f5f5;
  color: #666;
  border-radius: 12rpx;
  border: none;
  
  &[disabled] {
    opacity: 0.5;
  }
}

.debug-log {
  max-height: 320rpx;
  background: #1e1e1e;
  border-radius: 12rpx;
  padding: 16rpx;
}

.log-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 8rpx;
  font-size: 20rpx;
  line-height: 1.5;
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

.log-out .log-tag { color: #98c379; }
.log-in .log-tag { color: #e5c07b; }
.log-ok .log-tag { color: #98c379; }
.log-error .log-tag,
.log-error .log-msg { color: #e06c75; }
.log-warn .log-tag { color: #d19a66; }

.log-empty {
  font-size: 24rpx;
  color: #888;
  text-align: center;
  display: block;
  padding: 20rpx 0;
}

/* 按钮点击效果 */
.ctrl-btn:active:not([disabled]) {
  transform: scale(0.98);
  opacity: 0.9;
}

.btn-connect:active:not([disabled]) {
  transform: scale(0.98);
}
</style>
