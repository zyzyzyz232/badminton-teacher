<template>
  <view class="page-container">
    <page-nav-bar title="考试列表" />
    <view class="top-bg">
      <view class="class-info">
        <text class="class-name">{{ className }}</text>
        <text class="subtitle">本课程考试配置</text>
      </view>
    </view>

    <view class="content-area">
      <view class="ratio-banner">
        <text class="ratio-label">考试块占比已用</text>
        <text class="ratio-value">{{ usedRatio }}% / 100%</text>
        <text class="ratio-remain">剩余 {{ remainingRatio }}%</text>
      </view>

      <view class="create-section">
        <view class="section-title">
          <text>考试列表</text>
        </view>
        <view class="create-btn" @click="goCreate">
          <text class="create-icon">+</text>
          <text>新建考试</text>
        </view>
      </view>

      <view v-if="examList.length > 0" class="exam-list">
        <view
          v-for="(item, idx) in examList"
          :key="resolveExamId(item) || 'exam-' + idx"
          class="exam-card"
        >
          <view class="card-main">
            <view class="exam-header">
              <text class="exam-title">{{ item.title || '未命名考试' }}</text>
              <text class="exam-status" :class="'st-' + (item.status ?? 0)">
                {{ statusText(item.status) }}
              </text>
            </view>
            <view class="exam-meta">
              <text>占比 {{ item.scoreRatio ?? 0 }}%</text>
              <text v-if="item.weekIndex != null"> · 第{{ item.weekIndex }}周</text>
              <text v-else-if="item.lessonWeekIndex != null"> · 第{{ item.lessonWeekIndex }}周</text>
            </view>
          </view>
          <view class="card-actions">
            <view class="action-btn" @click="goEdit(item)">编辑</view>
            <view class="action-btn" @click="goItems(item)">考核项</view>
            <view class="action-btn enter" @click="enterExamRoom(item)">进入考场</view>
            <view class="action-btn danger" @click="confirmDelete(item)">删除</view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-text">暂无考试</text>
        <text class="empty-tip">点击「新建考试」配置本场考试与考核项</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  fetchExamListByCourse,
  deleteExam,
  resolveExamId,
  calcScoreRatioUsage,
  validateExamReadyForRoom,
} from '../../services/examApi.js'

const courseId = ref(0)
const classId = ref(0)
const className = ref('')
const examList = ref([])

const usage = computed(() => calcScoreRatioUsage(examList.value))
const usedRatio = computed(() => usage.value.used)
const remainingRatio = computed(() => usage.value.remaining)

function decodeName(raw) {
  if (!raw) return '考试列表'
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function statusText(status) {
  const map = { 0: '配置中', 1: '可开考', 2: '进行中', 3: '已结束' }
  return map[status] || '配置中'
}

async function loadList() {
  if (!courseId.value) return
  uni.showLoading({ title: '加载中...' })
  try {
    const data = await fetchExamListByCourse(courseId.value)
    examList.value = Array.isArray(data) ? data : []
  } catch (e) {
    examList.value = []
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function goCreate() {
  const name = encodeURIComponent(className.value || '')
  uni.navigateTo({
    url: `/pages/exam-create/exam-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}`,
  })
}

function goEdit(item) {
  const id = resolveExamId(item)
  if (!id) {
    uni.showToast({ title: '考试编号无效', icon: 'none' })
    return
  }
  const name = encodeURIComponent(className.value || '')
  uni.navigateTo({
    url: `/pages/exam-create/exam-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}&examId=${id}`,
  })
}

function goItems(item) {
  const id = resolveExamId(item)
  if (!id) {
    uni.showToast({ title: '考试编号无效', icon: 'none' })
    return
  }
  const title = encodeURIComponent(item.title || '考核项')
  const name = encodeURIComponent(className.value || '')
  uni.navigateTo({
    url: `/pages/exam-items/exam-items?examId=${id}&examTitle=${title}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`,
  })
}

async function enterExamRoom(item) {
  const id = resolveExamId(item)
  if (!id) {
    uni.showToast({ title: '考试编号无效', icon: 'none' })
    return
  }
  uni.showLoading({ title: '校验配置...' })
  try {
    const result = await validateExamReadyForRoom(id)
    uni.hideLoading()
    if (!result.ok) {
      uni.showToast({ title: result.reason || '配置未完成', icon: 'none', duration: 2500 })
      return
    }
    uni.showToast({ title: '考场功能将在阶段二开放', icon: 'none', duration: 2500 })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: e.message || '校验失败', icon: 'none' })
  }
}

function confirmDelete(item) {
  const id = resolveExamId(item)
  if (!id) return
  uni.showModal({
    title: '确认删除',
    content: `确定删除「${item.title || '该考试'}」吗？`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '删除中...' })
      try {
        await deleteExam(id)
        uni.showToast({ title: '已删除', icon: 'success' })
        loadList()
      } catch (e) {
        uni.showToast({ title: e.message || '删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
}

onLoad((options) => {
  options = options || {}
  courseId.value = parseInt(options.courseId, 10) || 0
  classId.value = parseInt(options.classId, 10) || 0
  className.value = decodeName(options.className)
})

onShow(() => {
  if (courseId.value) loadList()
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.top-bg {
  height: 240rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 60rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.class-info {
  text-align: center;
  color: #fff;
}

.class-name {
  font-size: 44rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

.content-area {
  padding: 30rpx;
  margin-top: -40rpx;
}

.ratio-banner {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.ratio-label {
  font-size: 26rpx;
  color: #666;
}

.ratio-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #07c160;
}

.ratio-remain {
  font-size: 24rpx;
  color: #999;
  margin-left: auto;
}

.create-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #07c160;
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
}

.create-icon {
  font-size: 32rpx;
  font-weight: bold;
}

.exam-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.exam-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.exam-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
  color: #666;

  &.st-1 {
    background: #e6f9ef;
    color: #07c160;
  }
  &.st-2 {
    background: #fff7e6;
    color: #fa8c16;
  }
  &.st-3 {
    background: #f5f5f5;
    color: #999;
  }
}

.exam-meta {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 20rpx;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.action-btn {
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  background: #f5f7fa;
  color: #333;

  &.enter {
    background: #e6f9ef;
    color: #07c160;
    font-weight: 500;
  }

  &.danger {
    color: #ff4d4f;
  }
}

.empty-state {
  padding: 80rpx 40rpx;
  text-align: center;
}

.empty-text {
  display: block;
  font-size: 30rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #999;
}
</style>
