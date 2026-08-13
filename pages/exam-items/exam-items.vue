<template>
  <view class="page-container">
    <page-nav-bar title="考核项" />
    <view class="top-bg">
      <view class="class-info">
        <text class="class-name">{{ examTitle }}</text>
        <text class="subtitle">配置考核项与权重</text>
      </view>
    </view>

    <view class="content-area">
      <view class="weight-banner" :class="{ warn: weightSum !== 100 && itemList.length > 0 }">
        <text>项内权重合计 {{ weightSum }}%（须等于 100%）</text>
      </view>

      <view class="create-section">
        <view class="section-title">考核项列表</view>
        <view class="create-btn" @click="goAdd">
          <text class="create-icon">+</text>
          <text>添加考核项</text>
        </view>
      </view>

      <view v-if="itemList.length > 0" class="item-list">
        <view
          v-for="(item, idx) in itemList"
          :key="resolveExamItemId(item) || 'item-' + idx"
          class="item-card"
        >
          <view class="item-main" @click="goEdit(item)">
            <view class="item-header">
              <text class="item-name">{{ item.itemName || item.name || '未命名' }}</text>
              <text class="item-algo">{{ algoText(item.algoType) }}</text>
            </view>
            <view class="item-meta">
              <text>满分 {{ item.maxScore ?? '-' }}</text>
              <text> · 权重 {{ item.weight ?? 0 }}%</text>
              <text v-if="item.sortOrder != null"> · 序 {{ item.sortOrder }}</text>
            </view>
          </view>
          <view class="card-actions">
            <view class="action-btn" @click="goEdit(item)">编辑 / 资料</view>
            <view class="action-btn danger" @click="confirmDelete(item)">删除</view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-text">暂无考核项</text>
        <text class="empty-tip">至少添加 1 项，项内权重合计须为 100%</text>
      </view>

      <button class="submit-btn outline" @click="goBackList">返回考试列表</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  fetchExamItemListByExam,
  deleteExamItem,
  resolveExamItemId,
  calcItemWeightSum,
} from '../../services/examApi.js'

const examId = ref(0)
const examTitle = ref('')
const courseId = ref(0)
const classId = ref(0)
const className = ref('')
const itemList = ref([])

const weightSum = computed(() => calcItemWeightSum(itemList.value))

function decodeName(raw, fallback = '') {
  if (!raw) return fallback
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function algoText(t) {
  const n = Number(t)
  if (n === 1) return '动作识别'
  if (n === 2) return '落点检测'
  return '未设置'
}

async function loadItems() {
  if (!examId.value) return
  uni.showLoading({ title: '加载中...' })
  try {
    const data = await fetchExamItemListByExam(examId.value)
    itemList.value = Array.isArray(data) ? data : []
  } catch (e) {
    itemList.value = []
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function goAdd() {
  const title = encodeURIComponent(examTitle.value || '')
  const name = encodeURIComponent(className.value || '')
  uni.navigateTo({
    url: `/pages/exam-item-edit/exam-item-edit?examId=${examId.value}&examTitle=${title}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`,
  })
}

function goEdit(item) {
  const id = resolveExamItemId(item)
  if (!id) {
    uni.showToast({ title: '考核项编号无效', icon: 'none' })
    return
  }
  const title = encodeURIComponent(examTitle.value || '')
  const name = encodeURIComponent(className.value || '')
  uni.navigateTo({
    url: `/pages/exam-item-edit/exam-item-edit?examId=${examId.value}&examItemId=${id}&examTitle=${title}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`,
  })
}

function confirmDelete(item) {
  const id = resolveExamItemId(item)
  if (!id) return
  const label = item.itemName || item.name || '该考核项'
  uni.showModal({
    title: '确认删除',
    content: `确定删除「${label}」吗？`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '删除中...' })
      try {
        await deleteExamItem(id)
        uni.showToast({ title: '已删除', icon: 'success' })
        loadItems()
      } catch (e) {
        uni.showToast({ title: e.message || '删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
}

function goBackList() {
  const name = encodeURIComponent(className.value || '')
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({
        url: `/pages/exam-list/exam-list?courseId=${courseId.value}&classId=${classId.value}&className=${name}`,
      })
    },
  })
}

onLoad((options) => {
  options = options || {}
  examId.value = parseInt(options.examId, 10) || 0
  examTitle.value = decodeName(options.examTitle, '考核项')
  courseId.value = parseInt(options.courseId, 10) || 0
  classId.value = parseInt(options.classId, 10) || 0
  className.value = decodeName(options.className)
})

onShow(() => {
  if (examId.value) loadItems()
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
  font-size: 40rpx;
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

.weight-banner {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #666;

  &.warn {
    background: #fff7e6;
    color: #d48806;
  }
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

.item-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.item-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.item-algo {
  font-size: 22rpx;
  color: #07c160;
  background: #e6f9ef;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.item-meta {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 16rpx;
}

.card-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  background: #f5f7fa;
  color: #333;

  &.danger {
    color: #ff4d4f;
  }
}

.empty-state {
  padding: 60rpx 40rpx;
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

.submit-btn.outline {
  margin-top: 40rpx;
  height: 88rpx;
  background: #fff;
  color: #07c160;
  border: 2rpx solid #07c160;
  font-size: 30rpx;
  border-radius: 44rpx;

  &::after {
    display: none;
  }
}
</style>
