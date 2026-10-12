<template>
  <view class="page">
    <page-nav-bar title="考试结果" :show-back="false" />
    <view class="header-bar">
      <text class="sub">选择课程与考试，查看 AI 初分与最终成绩</text>
    </view>

    <scroll-view scroll-x class="chip-wrap" enable-flex>
      <view
        v-for="course in courseList"
        :key="course.id"
        class="chip"
        :class="{ active: Number(course.id) === Number(courseId) }"
        @click="selectCourse(course)"
      >
        <text>{{ course.name || course.courseClass || '课程' }}</text>
      </view>
    </scroll-view>

    <view v-if="!courseList.length && !loading" class="empty">
      <text class="empty-title">暂无课程</text>
      <text class="empty-tip">请先在「我的课程」中创建课程</text>
    </view>

    <view v-else-if="examList.length" class="exam-pick">
      <view
        v-for="exam in examList"
        :key="resolveExamId(exam)"
        class="exam-chip"
        :class="{ active: Number(resolveExamId(exam)) === Number(examId) }"
        @click="selectExam(exam)"
      >
        <text>{{ exam.title || '未命名考试' }}</text>
      </view>
    </view>

    <view v-else-if="courseId && !loading" class="empty">
      <text class="empty-title">该课程暂无考试</text>
    </view>

    <scroll-view v-if="examId" scroll-y class="list-wrap">
      <view v-if="!rows.length && !loadingScores" class="empty">
        <text class="empty-title">暂无成绩记录</text>
        <text class="empty-tip">考场提交视频或标记缺考后会出现在这里</text>
      </view>
      <view
        v-for="row in rows"
        :key="row.key"
        class="score-card"
        @click="openDetail(row)"
      >
        <view class="score-head">
          <text class="score-name">{{ row.studentName }}</text>
          <text class="score-status" :class="'st-' + row.status">{{ row.statusText }}</text>
        </view>
        <text class="score-item">{{ row.itemName }}</text>
        <view class="score-meta">
          <text>AI {{ formatScore(row.algoScore) }}</text>
          <text>最终 {{ formatScore(row.finalScore) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  fetchTeacherCourses,
  fetchCourseClasses,
  fetchExamListByCourse,
  fetchExamItemListByExam,
  fetchExamScoreListByExam,
  fetchClassStudents,
  resolveExamId,
  resolveExamItemId,
  examScoreStatusText,
  EXAM_RESULTS_STORAGE_KEYS,
  mapClassStudentToExaminee,
} from '../../services/examApi.js'

const courseList = ref([])
const examList = ref([])
const courseId = ref(0)
const classId = ref(0)
const examId = ref(0)
const rows = ref([])
const loading = ref(false)
const loadingScores = ref(false)

function persistSelection() {
  try {
    uni.setStorageSync(EXAM_RESULTS_STORAGE_KEYS.courseId, courseId.value)
    uni.setStorageSync(EXAM_RESULTS_STORAGE_KEYS.examId, examId.value)
    uni.setStorageSync(EXAM_RESULTS_STORAGE_KEYS.classId, classId.value)
  } catch {
    /* ignore */
  }
}

function readStored(key) {
  const raw = uni.getStorageSync(key)
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function formatScore(v) {
  if (v == null || v === '') return '--'
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(1) : String(v)
}

function studentNameOf(student) {
  if (!student) return '未知学员'
  return student.name || student.studentName || '未知学员'
}

async function resolveClassId(cid) {
  try {
    const classes = await fetchCourseClasses(cid)
    const first = Array.isArray(classes) && classes.length ? classes[0] : null
    const id = Number(first && (first.classId ?? first.id))
    if (Number.isFinite(id) && id > 0) return id
  } catch {
    /* fall through */
  }
  return cid
}

async function selectCourse(course) {
  const id = Number(course.id)
  if (!id) return
  courseId.value = id
  examId.value = 0
  rows.value = []
  classId.value = await resolveClassId(id)
  persistSelection()
  await loadExams()
}

async function selectExam(exam) {
  const id = resolveExamId(exam)
  if (!id) return
  examId.value = id
  persistSelection()
  await loadScores()
}

function openDetail(row) {
  if (!row.scoreId) {
    uni.showToast({ title: '该学员此项尚未提交', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/exam-result-detail/exam-result-detail?id=${row.scoreId}`,
  })
}

async function loadCourses() {
  loading.value = true
  try {
    courseList.value = await fetchTeacherCourses()
    const storedCourse = readStored(EXAM_RESULTS_STORAGE_KEYS.courseId)
    const match = courseList.value.find((c) => Number(c.id) === storedCourse)
    if (match) {
      await selectCourse(match)
      const storedExam = readStored(EXAM_RESULTS_STORAGE_KEYS.examId)
      if (storedExam && examList.value.some((e) => resolveExamId(e) === storedExam)) {
        examId.value = storedExam
        persistSelection()
        await loadScores()
      }
    } else if (courseList.value[0]) {
      await selectCourse(courseList.value[0])
    }
  } catch (e) {
    uni.showToast({ title: e.message || '加载课程失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadExams() {
  if (!courseId.value) return
  try {
    const data = await fetchExamListByCourse(courseId.value)
    examList.value = Array.isArray(data) ? data : []
    if (!examId.value && examList.value[0]) {
      await selectExam(examList.value[0])
    }
  } catch (e) {
    examList.value = []
    uni.showToast({ title: e.message || '加载考试失败', icon: 'none' })
  }
}

async function loadScores() {
  if (!examId.value) return
  loadingScores.value = true
  try {
    const [itemsRaw, scoresRaw, studentsRaw] = await Promise.all([
      fetchExamItemListByExam(examId.value),
      fetchExamScoreListByExam(examId.value),
      classId.value ? fetchClassStudents(classId.value) : Promise.resolve([]),
    ])
    const items = Array.isArray(itemsRaw) ? itemsRaw : []
    const scores = Array.isArray(scoresRaw) ? scoresRaw : []
    const students = (Array.isArray(studentsRaw) ? studentsRaw : [])
      .map(mapClassStudentToExaminee)
      .filter(Boolean)
    const scoreByKey = new Map()
    scores.forEach((s) => {
      const sid = String(s.studentId ?? '')
      const iid = String(s.examItemId ?? '')
      if (sid && iid) scoreByKey.set(`${sid}:${iid}`, s)
    })
    const studentById = new Map()
    students.forEach((st) => {
      if (st.userId) studentById.set(String(st.userId), st)
    })
    const built = []
    const studentIds = new Set()
    students.forEach((st) => {
      if (st.userId) studentIds.add(String(st.userId))
    })
    scores.forEach((s) => {
      if (s.studentId != null) studentIds.add(String(s.studentId))
    })
    const itemList = items.length
      ? items
      : scores.map((s) => ({
          id: s.examItemId,
          itemName: s.itemName || '考核项',
        }))
    studentIds.forEach((sid) => {
      const student = studentById.get(sid)
      itemList.forEach((item) => {
        const iid = String(resolveExamItemId(item) || item.id || '')
        const score = scoreByKey.get(`${sid}:${iid}`)
        const status = score ? Number(score.status) : 0
        built.push({
          key: `${sid}:${iid}`,
          scoreId: score && score.id != null ? score.id : '',
          studentId: sid,
          studentName: studentNameOf(student) || (score && score.studentName) || `学员 ${sid}`,
          itemName: (score && score.itemName) || item.itemName || '考核项',
          status,
          statusText: score ? score.statusText || examScoreStatusText(status) : '未考',
          algoScore: score ? score.algoScore : null,
          finalScore: score ? score.finalScore : null,
        })
      })
    })
    rows.value = built
  } catch (e) {
    rows.value = []
    uni.showToast({ title: e.message || '加载成绩失败', icon: 'none' })
  } finally {
    loadingScores.value = false
  }
}

onShow(() => {
  loadCourses()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40rpx;
}
.header-bar {
  padding: 8rpx 32rpx 16rpx;
}
.sub {
  font-size: 24rpx;
  color: #888;
}
.chip-wrap {
  white-space: nowrap;
  padding: 0 24rpx 16rpx;
}
.chip,
.exam-chip {
  display: inline-flex;
  padding: 12rpx 24rpx;
  margin-right: 12rpx;
  border-radius: 32rpx;
  background: #fff;
  font-size: 24rpx;
  color: #333;
}
.chip.active,
.exam-chip.active {
  background: #07c160;
  color: #fff;
}
.exam-pick {
  padding: 0 24rpx 16rpx;
  white-space: nowrap;
  overflow-x: auto;
}
.list-wrap {
  height: calc(100vh - 360rpx);
  padding: 0 24rpx;
}
.score-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.score-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.score-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}
.score-status {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
  color: #666;
}
.st-1 { background: #fff7e6; color: #fa8c16; }
.st-2 { background: #e6f4ff; color: #1677ff; }
.st-3 { background: #e6f9ef; color: #07c160; }
.st-4 { background: #fff1f0; color: #ff4d4f; }
.st-5 { background: #f5f5f5; color: #999; }
.score-item {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #666;
}
.score-meta {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #888;
}
.empty {
  padding: 80rpx 40rpx;
  text-align: center;
}
.empty-title {
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
