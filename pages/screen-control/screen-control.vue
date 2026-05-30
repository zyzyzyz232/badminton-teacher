<template>
  <view class="page">
    <view class="card">
      <text class="card-title">中继连接</text>
      <view class="field">
        <text class="label">WebSocket 地址</text>
        <input v-model="relayWs" class="input" placeholder="ws://局域网IP:3456" />
      </view>
      <view class="field">
        <text class="label">房间号</text>
        <input v-model="roomId" class="input" placeholder="大屏上显示的房间号" />
      </view>
      <view class="field">
        <text class="label">令牌</text>
        <input v-model="token" class="input" placeholder="大屏上显示的令牌" />
      </view>
      <button class="btn primary" :disabled="connecting" @click="handleConnect">
        {{ socketJoined ? '已连接' : connecting ? '连接中…' : '连接' }}
      </button>
      <text v-if="statusLine" class="status">{{ statusLine }}</text>
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

const BASE_URL = 'http://10.112.189.54:48080/admin-api'

const relayWs = ref('ws://127.0.0.1:3456')
const roomId = ref('')
const token = ref('')
const connecting = ref(false)
const socketJoined = ref(false)
const statusLine = ref('')

const lessonId = ref(0)
const planId = ref(0)
const planTitle = ref('')

const loadingPlan = ref(false)
const planIds = ref([])
const currentIndex = ref(0)
const planCount = computed(() => planIds.value.length)

const getToken = () => uni.getStorageSync('token') || ''

const requestGet = (url, data) =>
  new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      header: {
        Authorization: `Bearer ${getToken()}`,
        'Tenant-Id': '1',
      },
      data,
      success: (res) => {
        if (res.statusCode === 200 && res.data?.code === 0) resolve(res.data.data || [])
        else reject(new Error(res.data?.msg || '请求失败'))
      },
      fail: reject,
    })
  })

function mergePlanPayload(projects, materials) {
  const ps = [...projects].sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id))
  const ms = [...materials].sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id))
  return ps.map((p, i) => {
    const m = ms[i] || {}
    const videoUrl = typeof m.videoUrl === 'string' && m.videoUrl ? m.videoUrl : undefined
    const desc = m.description || m.title
    const instruction = typeof desc === 'string' && desc ? desc : undefined
    const row = {
      id: String(p.id),
      title: p.itemName || `项目${p.id}`,
      durationMin: Math.max(1, Math.round(Number(p.duration)) || 1),
    }
    if (videoUrl) row.videoUrl = videoUrl
    if (instruction) row.instruction = instruction
    return row
  })
}

function sendRaw(obj) {
  try {
    uni.sendSocketMessage({ data: JSON.stringify(obj) })
  } catch (e) {
    statusLine.value = '发送失败'
    console.error(e)
  }
}

function sendCmd(name, payload) {
  sendRaw({ type: 'command', name, payload })
}

function onSocketMessageHandler(res) {
  try {
    const msg = JSON.parse(res.data)
    if (msg.type === 'joined') {
      socketJoined.value = true
      connecting.value = false
      statusLine.value = '已加入房间'
      try {
        uni.setStorageSync('relayWs', relayWs.value.trim())
      } catch {
        /* noop */
      }
      void pushSetPlan()
      return
    }
    if (msg.type === 'state' && msg.state?.plan?.length) {
      planIds.value = msg.state.plan.map((p) => p.id)
      const idx = msg.state.plan.findIndex((p) => p.id === msg.state.currentItemId)
      if (idx >= 0) currentIndex.value = idx
      return
    }
    if (msg.type === 'error') {
      statusLine.value = msg.message || msg.code || '错误'
      connecting.value = false
    }
  } catch {
    statusLine.value = '消息解析失败'
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
    sendRaw({
      type: 'join',
      role: 'mobile',
      roomId: roomId.value.trim(),
      token: token.value.trim(),
    })
  })
  uni.onSocketMessage(onSocketMessageHandler)
  uni.onSocketError(() => {
    statusLine.value = 'WebSocket 错误'
    connecting.value = false
  })
  uni.onSocketClose(() => {
    socketJoined.value = false
    connecting.value = false
    statusLine.value = '连接已关闭'
  })
}

function handleConnect() {
  if (socketJoined.value) return
  if (!relayWs.value.trim()) {
    uni.showToast({ title: '请填写 WS 地址', icon: 'none' })
    return
  }
  if (!roomId.value.trim() || !token.value.trim()) {
    uni.showToast({ title: '请填写房间号与令牌', icon: 'none' })
    return
  }
  statusLine.value = ''
  connecting.value = true
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
      statusLine.value = '无法发起连接'
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
    const projects = await requestGet(`${BASE_URL}/teaching/plan-project/list-by-plan`, {
      planId: planId.value,
    })
    let materials = []
    try {
      materials = await requestGet(`${BASE_URL}/teaching/plan-material/list-by-plan`, {
        planId: planId.value,
      })
    } catch {
      materials = []
    }
    const plan = mergePlanPayload(projects, materials)
    if (!plan.length) {
      uni.showToast({ title: '训练项为空', icon: 'none' })
      loadingPlan.value = false
      return
    }
    planIds.value = plan.map((p) => p.id)
    currentIndex.value = 0
    sendCmd('setPlan', { plan, currentItemId: plan[0].id })
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
  const savedWs = uni.getStorageSync('relayWs')
  if (typeof savedWs === 'string' && savedWs) relayWs.value = savedWs
  uni.setNavigationBarTitle({ title: '大屏遥控' })
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
</style>
