<template>
  <view class="page-container">
    <page-nav-bar :title="isEdit ? '编辑考试' : '新建考试'" />
    <view class="top-bg">
      <view class="class-info">
        <text class="class-name">{{ className }}</text>
        <text class="subtitle">{{ isEdit ? '考试信息与考核项' : '关联考试课堂与成绩占比' }}</text>
      </view>
    </view>

    <view class="content-area">
      <view class="form-card">
        <view class="form-title">考试信息</view>

        <view class="hint-row">
          <text>本课程已用占比 {{ usedRatio }}%，剩余 {{ remainingRatio }}%</text>
        </view>

        <view class="form-item">
          <text class="form-label">考试标题</text>
          <input
            class="form-input"
            v-model="form.title"
            placeholder="如：第3周考试"
            maxlength="128"
          />
        </view>

        <view class="form-item">
          <text class="form-label">本场成绩占比（%）</text>
          <input
            class="form-input"
            type="number"
            v-model="scoreRatioText"
            placeholder="1–100"
          />
        </view>

        <view class="form-item">
          <text class="form-label">关联考试课堂</text>
          <picker
            v-if="lessonOptions.length > 0"
            mode="selector"
            :range="lessonLabels"
            :value="lessonIndex"
            @change="onLessonChange"
          >
            <view class="form-picker" :class="{ placeholder: lessonIndex < 0 }">
              {{ lessonIndex >= 0 ? lessonLabels[lessonIndex] : '请选择考试课堂' }}
            </view>
          </picker>
          <view v-else class="form-picker placeholder">暂无考试课堂</view>
          <view class="link-row">
            <text class="link-btn" @click="goCreateLesson">新建考试课堂</text>
            <text class="link-btn ghost" @click="reloadLessons">刷新列表</text>
          </view>
        </view>
      </view>

      <button class="submit-btn" :loading="saving" @click="submit">
        {{ isEdit ? '保存考试信息' : '创建考试' }}
      </button>

      <view v-if="isEdit" class="items-block">
        <view class="weight-banner" :class="{ warn: weightSum !== 100 && itemList.length > 0 }">
          <text>项内权重合计 {{ weightSum }}%（须等于 100%）</text>
        </view>

        <view class="create-section">
          <view class="section-title">考核项列表</view>
          <view class="create-btn" @click="goAddItem">
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
            <view class="item-main" @click="goEditItem(item)">
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
              <view class="action-btn" @click="goEditItem(item)">编辑 / 资料</view>
              <view class="action-btn danger" @click="confirmDeleteItem(item)">删除</view>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-text">暂无考核项</text>
          <text class="empty-tip">至少添加 1 项，项内权重合计须为 100%</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  fetchExamListByCourse,
  fetchExamGet,
  createExam,
  updateExam,
  fetchLessonsByCourse,
  fetchExamItemListByExam,
  deleteExamItem,
  calcScoreRatioUsage,
  calcItemWeightSum,
  resolveExamId,
  resolveLessonId,
  resolveExamItemId,
  normalizeCreateLongId,
} from '../../services/examApi.js'

const courseId = ref(0)
const classId = ref(0)
const className = ref('')
const examId = ref(0)
const isEdit = computed(() => examId.value > 0)

const form = reactive({
  title: '',
  scoreRatio: 0,
  lessonId: 0,
})
const scoreRatioText = ref('')
const lessonOptions = ref([])
const lessonIndex = ref(-1)
const examList = ref([])
const itemList = ref([])
const saving = ref(false)
const skipNextShowReload = ref(true)
const weightSum = computed(() => calcItemWeightSum(itemList.value))

const usage = computed(() =>
  calcScoreRatioUsage(examList.value, isEdit.value ? examId.value : 0)
)
const usedRatio = computed(() => usage.value.used)
const remainingRatio = computed(() => usage.value.remaining)

function sameLessonId(a, b) {
  const na = Number(a)
  const nb = Number(b)
  return Number.isFinite(na) && na > 0 && na === nb
}

function syncLessonIndex() {
  if (!form.lessonId) {
    lessonIndex.value = -1
    return
  }
  const idx = lessonOptions.value.findIndex((r) =>
    sameLessonId(resolveLessonId(r), form.lessonId)
  )
  lessonIndex.value = idx
}

const lessonLabels = computed(() =>
  lessonOptions.value.map((row) => {
    const week = row.weekIndex != null ? `第${row.weekIndex}周` : '课堂'
    const id = resolveLessonId(row)
    return `${week}（ID ${id}）`
  })
)

function decodeName(raw) {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

async function loadExamList() {
  if (!courseId.value) return
  try {
    const data = await fetchExamListByCourse(courseId.value)
    examList.value = Array.isArray(data) ? data : []
  } catch {
    examList.value = []
  }
}

async function reloadLessons() {
  if (!courseId.value) return
  try {
    lessonOptions.value = await fetchLessonsByCourse(courseId.value, { type: 2 })
    syncLessonIndex()
  } catch (e) {
    lessonOptions.value = []
    uni.showToast({ title: e.message || '加载课堂失败', icon: 'none' })
  }
}

function onLessonChange(e) {
  const idx = Number(e.detail.value)
  lessonIndex.value = idx
  const row = lessonOptions.value[idx]
  form.lessonId = row ? resolveLessonId(row) : 0
  if (!form.title && row && row.weekIndex != null) {
    form.title = `第${row.weekIndex}周考试`
  }
}

function goCreateLesson() {
  const name = encodeURIComponent(className.value || '')
  uni.navigateTo({
    url: `/pages/lesson-create/lesson-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}&preferType=2`,
  })
}

function algoText(t) {
  const n = Number(t)
  if (n === 1) return '动作分析'
  if (n === 2) return '落点检测'
  return '未设置'
}

async function loadItems() {
  if (!examId.value) {
    itemList.value = []
    return
  }
  try {
    const data = await fetchExamItemListByExam(examId.value)
    itemList.value = Array.isArray(data) ? data : []
  } catch (e) {
    itemList.value = []
    uni.showToast({ title: e.message || '加载考核项失败', icon: 'none' })
  }
}

function itemEditQuery(extra = '') {
  const title = encodeURIComponent(form.title || '考核项')
  const name = encodeURIComponent(className.value || '')
  return `/pages/exam-item-edit/exam-item-edit?examId=${examId.value}&examTitle=${title}&courseId=${courseId.value}&classId=${classId.value}&className=${name}${extra}`
}

function goAddItem() {
  uni.navigateTo({ url: itemEditQuery() })
}

function goEditItem(item) {
  const id = resolveExamItemId(item)
  if (!id) {
    uni.showToast({ title: '考核项编号无效', icon: 'none' })
    return
  }
  uni.navigateTo({ url: itemEditQuery(`&examItemId=${id}`) })
}

function confirmDeleteItem(item) {
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
        await loadItems()
      } catch (e) {
        uni.showToast({ title: e.message || '删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
  })
}

async function loadDetail() {
  if (!examId.value) return
  uni.showLoading({ title: '加载中...' })
  try {
    const data = await fetchExamGet(examId.value)
    if (data) {
      form.title = data.title || ''
      form.scoreRatio = Number(data.scoreRatio) || 0
      scoreRatioText.value = String(form.scoreRatio || '')
      form.lessonId = Number(data.lessonId ?? data.lesson_id) || 0
      await reloadLessons()
    }
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

async function submit() {
  const title = (form.title || '').trim()
  if (!title) {
    uni.showToast({ title: '请填写考试标题', icon: 'none' })
    return
  }
  const ratio = parseInt(String(scoreRatioText.value).trim(), 10)
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 100) {
    uni.showToast({ title: '占比须为 1–100 的整数', icon: 'none' })
    return
  }
  if (ratio > remainingRatio.value) {
    uni.showToast({
      title: `占比超出：已占用 ${usedRatio.value}%，剩余 ${remainingRatio.value}%`,
      icon: 'none',
      duration: 2500,
    })
    return
  }
  if (!form.lessonId) {
    uni.showToast({ title: '请选择考试课堂', icon: 'none' })
    return
  }

  saving.value = true
  uni.showLoading({ title: '保存中...' })
  try {
    if (isEdit.value) {
      await updateExam({
        id: examId.value,
        courseId: courseId.value,
        lessonId: form.lessonId,
        title,
        scoreRatio: ratio,
      })
      uni.showToast({ title: '考试信息已保存', icon: 'success' })
      await loadExamList()
    } else {
      const data = await createExam({
        courseId: courseId.value,
        lessonId: form.lessonId,
        title,
        scoreRatio: ratio,
      })
      const newId = normalizeCreateLongId(data) || resolveExamId(data)
      if (!newId) {
        uni.showToast({ title: '创建成功但未返回编号', icon: 'none' })
        return
      }
      examId.value = Number(newId)
      uni.showToast({ title: '已创建，可添加考核项', icon: 'success' })
      await loadExamList()
      await loadItems()
    }
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none', duration: 2800 })
  } finally {
    uni.hideLoading()
    saving.value = false
  }
}

onLoad(async (options) => {
  options = options || {}
  courseId.value = parseInt(options.courseId, 10) || 0
  classId.value = parseInt(options.classId, 10) || 0
  className.value = decodeName(options.className)
  examId.value = parseInt(options.examId, 10) || 0
  const preLessonId = parseInt(options.lessonId, 10) || 0
  const preWeek = parseInt(options.lessonWeek, 10) || 0
  await loadExamList()
  await reloadLessons()
  if (isEdit.value) {
    await loadDetail()
    await loadItems()
  } else if (preLessonId) {
    form.lessonId = preLessonId
    syncLessonIndex()
    if (!form.title && preWeek) {
      form.title = `第${preWeek}周考试`
    }
  }
  skipNextShowReload.value = true
})

onShow(async () => {
  if (skipNextShowReload.value) {
    skipNextShowReload.value = false
    return
  }
  await loadExamList()
  await reloadLessons()
  if (examId.value) await loadItems()
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

.form-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
  padding-left: 20rpx;
  border-left: 8rpx solid #07c160;
}

.hint-row {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 32rpx;
  background: #f5f7fa;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
}

.form-item {
  margin-bottom: 36rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-input,
.form-picker {
  height: 90rpx;
  background-color: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
  color: #333;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.form-picker.placeholder {
  color: #999;
}

.link-row {
  display: flex;
  gap: 32rpx;
  margin-top: 16rpx;
}

.link-btn {
  font-size: 26rpx;
  color: #07c160;

  &.ghost {
    color: #666;
  }
}

.submit-btn {
  margin-top: 60rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  color: #fff;
  font-size: 34rpx;
  font-weight: bold;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    display: none;
  }
}

.items-block {
  margin-top: 48rpx;
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
  background: #fff;
  border-radius: 16rpx;
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
