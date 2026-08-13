<template>
  <view class="page-container">
    <page-nav-bar :title="isEdit ? '编辑考试' : '新建考试'" />
    <view class="top-bg">
      <view class="class-info">
        <text class="class-name">{{ className }}</text>
        <text class="subtitle">{{ isEdit ? '修改考试配置' : '关联考试课堂与成绩占比' }}</text>
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
        {{ isEdit ? '保存修改' : '创建并配置考核项' }}
      </button>
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
  calcScoreRatioUsage,
  resolveExamId,
  resolveLessonId,
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
const saving = ref(false)
const skipNextShowReload = ref(true)

const usage = computed(() =>
  calcScoreRatioUsage(examList.value, isEdit.value ? examId.value : 0)
)
const usedRatio = computed(() => usage.value.used)
const remainingRatio = computed(() => usage.value.remaining)

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
    if (form.lessonId) {
      const idx = lessonOptions.value.findIndex(
        (r) => resolveLessonId(r) === form.lessonId
      )
      lessonIndex.value = idx
    }
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

async function loadDetail() {
  if (!examId.value) return
  uni.showLoading({ title: '加载中...' })
  try {
    const data = await fetchExamGet(examId.value)
    if (data) {
      form.title = data.title || ''
      form.scoreRatio = Number(data.scoreRatio) || 0
      scoreRatioText.value = String(form.scoreRatio || '')
      form.lessonId = resolveLessonId(data) || Number(data.lessonId) || 0
      await reloadLessons()
      const idx = lessonOptions.value.findIndex(
        (r) => resolveLessonId(r) === form.lessonId
      )
      lessonIndex.value = idx
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
      uni.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 500)
    } else {
      const data = await createExam({
        courseId: courseId.value,
        lessonId: form.lessonId,
        title,
        scoreRatio: ratio,
      })
      const newId = normalizeCreateLongId(data) || resolveExamId(data)
      uni.showToast({ title: '创建成功', icon: 'success' })
      const name = encodeURIComponent(className.value || '')
      const et = encodeURIComponent(title)
      setTimeout(() => {
        if (newId) {
          uni.redirectTo({
            url: `/pages/exam-items/exam-items?examId=${newId}&examTitle=${et}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`,
          })
        } else {
          uni.navigateBack()
        }
      }, 400)
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
  } else if (preLessonId) {
    form.lessonId = preLessonId
    const idx = lessonOptions.value.findIndex(
      (r) => resolveLessonId(r) === preLessonId
    )
    lessonIndex.value = idx
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
</style>
