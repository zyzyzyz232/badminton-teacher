<template>
  <view class="page-container">
    <page-nav-bar title="动作分析" />
    <view class="top-card">
      <view class="info-row">
        <text class="label">班级</text>
        <text class="value">{{ className || '--' }}</text>
      </view>
      <view class="info-row">
        <text class="label">学员</text>
        <text class="value">{{ studentName || '--' }}</text>
      </view>
      <view v-if="studentNo" class="info-row">
        <text class="label">学号</text>
        <text class="value">{{ studentNo }}</text>
      </view>
      <view class="info-row">
        <text class="label">考核项目</text>
        <text class="value">{{ itemName || examTypeLabel }}</text>
      </view>
      <view v-if="taskStatusText" class="info-row">
        <text class="label">任务状态</text>
        <text class="value">{{ taskStatusText }}</text>
      </view>
    </view>

    <view class="preview-reserved">
      <text class="preview-title">{{ isActionAnalysis ? '动作分析录像' : '预览与识别区域' }}</text>
      <text class="preview-desc">{{ previewDesc }}</text>
    </view>

    <view class="bottom-actions">
      <view v-if="isActionAnalysis && paramsReady" class="btn-row">
        <view
          class="btn btn-start"
          :class="{ 'btn--disabled': busy }"
          @click="onStartRecord"
        >
          <text>{{ busy ? '处理中…' : '开始录像' }}</text>
        </view>
        <view
          class="btn btn-upload-test"
          :class="{ 'btn--disabled': busy }"
          @click="onUploadFromAlbum"
        >
          <text>{{ busy ? '处理中…' : '本地上传' }}</text>
        </view>
      </view>
      <view v-else class="btn-row">
        <view class="btn btn-start" @click="onStartLandingPlaceholder">
          <text>开始识别</text>
        </view>
      </view>
      <view v-if="scoreId && Number(taskStatus) === 2" class="btn-row extra">
        <view class="btn btn-start" @click="goDetail">查看并改分</view>
      </view>
      <view v-if="scoreId && Number(taskStatus) === 4" class="btn-row extra">
        <view class="btn btn-upload-test" :class="{ 'btn--disabled': busy }" @click="onRetry">
          <text>失败重试</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import {
  submitExamScoreVideo,
  fetchExamScoreGet,
  retryExamScore,
  examScoreStatusText,
} from '../../services/examApi.js'

const examId = ref(0)
const examItemId = ref(0)
const classId = ref(0)
const className = ref('')
const examType = ref('')
const itemName = ref('')
const classStudentId = ref('')
const studentId = ref('')
const studentName = ref('')
const studentNo = ref('')
const isUploading = ref(false)
const scoreId = ref(0)
const taskStatus = ref(null)
const taskStatusText = ref('')
let pollTimer = null

const busy = computed(() => isUploading.value)
const isActionAnalysis = computed(() => examType.value === 'action_recognition')
const paramsReady = computed(
  () =>
    !!examId.value &&
    !!examItemId.value &&
    !!studentId.value &&
    isActionAnalysis.value,
)

const examTypeLabel = computed(() => {
  if (examType.value === 'landing') return '落点检测'
  if (examType.value === 'action_recognition') return '动作分析'
  return examType.value || '--'
})

const previewDesc = computed(() => {
  if (!isActionAnalysis.value) return '落点检测暂未开放'
  if (!paramsReady.value) return '缺少考试或学员参数，请从考场进入'
  if (Number(taskStatus.value) === 1) return '视频已提交，正在计算中…'
  if (Number(taskStatus.value) === 2) return '计算完成，可查看 AI 初分并改最终分'
  if (Number(taskStatus.value) === 4) return '分析失败，可重试或重新上传'
  return '点击开始录像调用手机摄像头，结束后提交到后台分析。本地上传仅用于调试。'
})

function decodeParam(raw) {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function isChooseCancel(err) {
  const msg = String((err && (err.errMsg || err.message)) || '')
  return msg.includes('cancel') || msg.includes('取消')
}

function pickChosenVideo(res) {
  const data = Array.isArray(res) ? res[1] || res[0] : res
  if (!data || typeof data !== 'object') {
    return { filePath: '', duration: null }
  }
  const file = (Array.isArray(data.tempFiles) && data.tempFiles[0]) || data
  const filePath =
    data.tempFilePath ||
    file.tempFilePath ||
    file.path ||
    (Array.isArray(data.tempFilePaths) && data.tempFilePaths[0]) ||
    ''
  const duration = data.duration != null ? data.duration : file.duration
  return { filePath, duration }
}

function showUploadError(err) {
  const title = (err && (err.message || err.errMsg)) || '上传失败'
  setTimeout(() => {
    if (title.length > 18) {
      uni.showModal({ title: '上传失败', content: title, showCancel: false })
    } else {
      uni.showToast({ title, icon: 'none', duration: 2800 })
    }
  }, 80)
}

async function chooseVideo(sourceType, maxDuration) {
  const albumOnly =
    Array.isArray(sourceType) && sourceType.length === 1 && sourceType[0] === 'album'
  // chooseVideo.maxDuration 上限 60；相册传 300 会立刻被微信拒绝并提示「上传视频失败」
  if (albumOnly && typeof uni.chooseMedia === 'function') {
    try {
      const media = await uni.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album'],
      })
      const picked = pickChosenVideo(media)
      if (picked.filePath) return picked
    } catch (e) {
      if (isChooseCancel(e)) return { filePath: '', duration: null }
    }
  }
  const duration = Math.min(60, Number(maxDuration) || 60)
  try {
    const chooseRes = await uni.chooseVideo({
      sourceType: albumOnly ? ['album', 'camera'] : sourceType,
      compressed: false,
      maxDuration: duration,
      camera: 'back',
    })
    return pickChosenVideo(chooseRes)
  } catch (e) {
    if (isChooseCancel(e)) return { filePath: '', duration: null }
    showUploadError(e)
    return { filePath: '', duration: null }
  }
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPoll() {
  stopPoll()
  pollTimer = setInterval(() => {
    refreshTask(true)
  }, 3000)
}

async function refreshTask(silent) {
  if (!scoreId.value) return
  try {
    const data = await fetchExamScoreGet(scoreId.value)
    taskStatus.value = data && data.status
    taskStatusText.value = (data && data.statusText) || examScoreStatusText(data && data.status)
    if (Number(taskStatus.value) !== 1) stopPoll()
  } catch (e) {
    if (!silent) uni.showToast({ title: e.message || '查询失败', icon: 'none' })
  }
}

async function uploadVideo(filePath, duration) {
  if (!filePath) {
    uni.showToast({ title: '未获取到视频文件', icon: 'none' })
    return
  }
  if (!paramsReady.value) {
    uni.showToast({ title: '参数不完整，请从考场进入', icon: 'none' })
    return
  }
  isUploading.value = true
  uni.showLoading({ title: '上传中…', mask: true })
  try {
    const durationSec = Math.round(Number(duration))
    const data = await submitExamScoreVideo({
      filePath,
      examId: examId.value,
      examItemId: examItemId.value,
      studentId: studentId.value,
      classId: classId.value,
      videoDuration: Number.isFinite(durationSec) ? durationSec : undefined,
    })
    scoreId.value = Number(data && (data.id || data.scoreId)) || 0
    taskStatus.value = data && data.status != null ? data.status : 1
    taskStatusText.value = (data && data.statusText) || examScoreStatusText(taskStatus.value)
    uni.hideLoading()
    setTimeout(() => {
      uni.showToast({ title: '已提交，计算中', icon: 'none' })
    }, 80)
    if (scoreId.value) startPoll()
  } catch (e) {
    uni.hideLoading()
    showUploadError(e)
  } finally {
    isUploading.value = false
  }
}

const onStartRecord = async () => {
  if (busy.value) return
  const picked = await chooseVideo(['camera'], 60)
  if (!picked.filePath) return
  await uploadVideo(picked.filePath, picked.duration)
}

const onUploadFromAlbum = async () => {
  if (busy.value) return
  const picked = await chooseVideo(['album'], 300)
  if (!picked.filePath) return
  await uploadVideo(picked.filePath, picked.duration)
}

const onStartLandingPlaceholder = () => {
  uni.showToast({ title: '暂未开放', icon: 'none' })
}

function goDetail() {
  if (!scoreId.value) return
  uni.navigateTo({
    url: `/pages/exam-result-detail/exam-result-detail?id=${scoreId.value}`,
  })
}

async function onRetry() {
  if (!scoreId.value || busy.value) return
  isUploading.value = true
  try {
    await retryExamScore(scoreId.value)
    taskStatus.value = 1
    taskStatusText.value = '计算中'
    startPoll()
    uni.showToast({ title: '已重新入队', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: e.message || '重试失败', icon: 'none' })
  } finally {
    isUploading.value = false
  }
}

onLoad((options) => {
  options = options || {}
  examId.value = parseInt(options.examId, 10) || 0
  examItemId.value = parseInt(options.examItemId, 10) || 0
  classId.value = parseInt(options.classId, 10) || 0
  className.value = decodeParam(options.className || '')
  examType.value = decodeParam(options.examType || '')
  itemName.value = decodeParam(options.itemName || '')
  classStudentId.value =
    options.classStudentId != null && options.classStudentId !== ''
      ? String(options.classStudentId)
      : ''
  studentId.value =
    options.userId != null && options.userId !== ''
      ? String(options.userId)
      : options.studentId != null
        ? String(options.studentId)
        : ''
  studentName.value = decodeParam(options.studentName || '')
  studentNo.value = decodeParam(options.studentNo || '')

  if (examType.value === 'landing' || Number(options.algoType) === 2) {
    examType.value = 'landing'
  }

  const requiredReady =
    !!examId.value && !!examItemId.value && !!studentId.value && isActionAnalysis.value
  if (examType.value === 'landing') {
    uni.showToast({ title: '暂未开放', icon: 'none' })
  } else if (!requiredReady) {
    uni.showToast({ title: '参数不完整，请从考场进入', icon: 'none' })
  }
})

onUnload(() => {
  stopPoll()
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
}

.top-card {
  margin: 24rpx 30rpx 0;
  padding: 28rpx 30rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  width: 140rpx;
  flex-shrink: 0;
  font-size: 26rpx;
  color: #999;
}

.value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
}

.preview-reserved {
  flex: 1;
  min-height: 420rpx;
  margin: 24rpx 30rpx;
  padding: 40rpx 32rpx;
  background: #fafbfc;
  border: 2rpx dashed #d0d5dd;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.preview-title {
  font-size: 30rpx;
  color: #666;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.preview-desc {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  line-height: 1.6;
}

.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 30rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, #f5f7fa 28%);
}

.btn-row {
  display: flex;
  gap: 20rpx;
}

.btn-row.extra {
  margin-top: 16rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: bold;
  box-sizing: border-box;

  text {
    color: inherit;
  }

  &:active {
    opacity: 0.92;
  }
}

.btn-start {
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  color: #fff;
}

.btn-upload-test {
  background: linear-gradient(135deg, #ff9f0a, #ff6a00);
  color: #fff;
}

.btn--disabled {
  opacity: 0.45;
  pointer-events: none;
}
</style>
