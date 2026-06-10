<template>
	<view class="page">
		<page-nav-bar :title="navTitle" />
		<view v-if="fromLesson" class="context-bar">
			<text class="context-text">{{ courseName }} · {{ lessonName }}</text>
		</view>

		<view class="plan-edit-card">
			<text class="plan-edit-title">{{ isNewMode ? '新建训练计划' : '编辑训练计划' }}</text>
			<view class="plan-edit-row">
				<text class="plan-edit-label">计划标题</text>
				<input class="plan-edit-input" v-model="planForm.planTitle" placeholder="请输入计划标题" />
			</view>
			<view class="plan-edit-row">
				<text class="plan-edit-label">计划内容</text>
				<textarea class="plan-edit-textarea" v-model="planForm.planContent" placeholder="计划说明 / 要求（选填）" />
			</view>
			<view class="plan-edit-row">
				<text class="plan-edit-label">计划类型</text>
				<picker mode="selector" :range="planTypeLabels" :value="planTypePickerIndex" @change="onPlanTypePick">
					<view class="plan-edit-picker">{{ planTypeLabels[planTypePickerIndex] }}</view>
				</picker>
			</view>
			<view class="plan-edit-row">
				<text class="plan-edit-label">难度</text>
				<picker mode="selector" :range="planDifficultyLabels" :value="planDifficultyPickerIndex" @change="onPlanDifficultyPick">
					<view class="plan-edit-picker">{{ planDifficultyLabels[planDifficultyPickerIndex] }}</view>
				</picker>
			</view>
			<view class="plan-edit-row">
				<text class="plan-edit-label">时长（分钟）</text>
				<input class="plan-edit-input" type="number" v-model="planForm.duration" placeholder="如 60" />
			</view>

			<view class="projects-entry" :class="{ disabled: !planId }" @click="goToProjects">
				<view class="projects-entry-main">
					<text class="projects-entry-title">编辑训练项目</text>
					<text class="projects-entry-sub">{{ projectsSummaryText }}</text>
				</view>
				<text class="projects-entry-arrow">›</text>
			</view>

			<button v-if="planId" class="plan-delete-plan-btn" @click="confirmDeleteTrainingPlan">删除训练计划</button>
		</view>

		<view class="footer">
			<button v-if="fromLesson" class="footer-btn ghost" @click="onSaveAndBack">保存并返回</button>
			<button class="footer-btn primary" type="primary" @click="onSave">保存</button>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
	fetchTrainingPlanDetail,
	fetchPlanProjectsByPlan,
	createTeachingPlan,
	getTeacherIdFromStorage,
	getTeacherNameFromStorage,
	updateTeachingPlan,
	deleteTeachingPlan,
} from '../../services/trainingPlanApi.js'

const planId = ref('')
const isNewMode = ref(false)
const navTitle = ref('训练计划')
const lessonIdFromQuery = ref(0)
const courseIdFromQuery = ref(0)
const lessonName = ref('')
const courseName = ref('')
const planDetailRaw = ref(null)
const projectCount = ref(0)
const projectTotalMin = ref(0)

const planForm = reactive({
	planTitle: '',
	planContent: '',
	duration: 60,
	planType: 1,
	difficulty: 1,
})

const planTypeLabels = ['常规', '专项', '测试']
const planDifficultyLabels = ['简单', '中等', '困难']

const fromLesson = computed(() => lessonIdFromQuery.value > 0)

const planTypePickerIndex = computed(() => {
	const t = Number(planForm.planType)
	const i = [1, 2, 3].indexOf(t)
	return i >= 0 ? i : 0
})

const planDifficultyPickerIndex = computed(() => {
	const t = Number(planForm.difficulty)
	const i = [1, 2, 3].indexOf(t)
	return i >= 0 ? i : 0
})

const projectsSummaryText = computed(() => {
	if (!planId.value) return '请先保存计划基本信息'
	if (projectCount.value <= 0) return '暂无训练项目，点击进入编排'
	const dur = projectTotalMin.value > 0 ? ` · 共 ${projectTotalMin.value} 分钟` : ''
	return `${projectCount.value} 个训练项目${dur}`
})

function applyPlanDetailToForm(d) {
	if (!d || typeof d !== 'object') return
	planForm.planTitle = d.planTitle != null ? String(d.planTitle) : ''
	planForm.planContent = d.planContent != null ? String(d.planContent) : ''
	const dur = d.duration != null ? Number(d.duration) : NaN
	planForm.duration = Number.isFinite(dur) && dur > 0 ? dur : 60
	const pt = d.planType != null ? Number(d.planType) : NaN
	planForm.planType = Number.isFinite(pt) && pt >= 1 && pt <= 3 ? pt : 1
	const df = d.difficulty != null ? Number(d.difficulty) : NaN
	planForm.difficulty = Number.isFinite(df) && df >= 1 && df <= 3 ? df : 1
}

async function loadProjectSummary() {
	if (!planId.value) {
		projectCount.value = 0
		projectTotalMin.value = 0
		return
	}
	try {
		const list = await fetchPlanProjectsByPlan(planId.value)
		const arr = Array.isArray(list) ? list : []
		projectCount.value = arr.length
		projectTotalMin.value = arr.reduce((sum, p) => {
			const d = p.duration != null ? Number(p.duration) : 0
			return sum + (Number.isFinite(d) ? d : 0)
		}, 0)
	} catch (_) {
		projectCount.value = 0
		projectTotalMin.value = 0
	}
}

async function loadPlanDetail() {
	if (!planId.value) {
		planDetailRaw.value = null
		return
	}
	try {
		const d = await fetchTrainingPlanDetail(planId.value)
		planDetailRaw.value = d
		applyPlanDetailToForm(d)
	} catch (_) {
		planDetailRaw.value = null
	}
}

async function loadData() {
	await loadPlanDetail()
	await loadProjectSummary()
}

function onPlanTypePick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) planForm.planType = i + 1
}

function onPlanDifficultyPick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) planForm.difficulty = i + 1
}

function buildProjectsQuery() {
	const parts = [`planId=${encodeURIComponent(planId.value)}`]
	if (lessonIdFromQuery.value > 0) parts.push(`lessonId=${encodeURIComponent(lessonIdFromQuery.value)}`)
	if (courseIdFromQuery.value > 0) parts.push(`courseId=${encodeURIComponent(courseIdFromQuery.value)}`)
	if (lessonName.value) parts.push(`lessonName=${encodeURIComponent(lessonName.value)}`)
	if (courseName.value) parts.push(`courseName=${encodeURIComponent(courseName.value)}`)
	const title = (planForm.planTitle || '').trim()
	if (title) parts.push(`planTitle=${encodeURIComponent(title)}`)
	return parts.join('&')
}

function goToProjects() {
	if (!planId.value) {
		uni.showToast({ title: '请先保存计划', icon: 'none' })
		return
	}
	uni.navigateTo({
		url: `/pages/training-plan-projects/training-plan-projects?${buildProjectsQuery()}`,
		fail: () => uni.showToast({ title: '跳转失败', icon: 'none' }),
	})
}

function confirmDeleteTrainingPlan() {
	const pid = parseInt(String(planId.value), 10)
	if (!Number.isFinite(pid) || pid <= 0) {
		uni.showToast({ title: '计划 id 无效', icon: 'none' })
		return
	}
	const title = (planForm.planTitle || '').trim() || '该训练计划'
	uni.showModal({
		title: '确认删除',
		content: `确定要删除「${title}」吗？删除后无法恢复。`,
		confirmColor: '#ff4d4f',
		success: async (res) => {
			if (!res.confirm) return
			try {
				uni.showLoading({ title: '删除中…' })
				await deleteTeachingPlan(pid)
				uni.hideLoading()
				uni.showToast({ title: '已删除', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 500)
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: (e && e.message) || '删除失败', icon: 'none' })
			}
		},
	})
}

async function persistPlanInfo() {
	const titleTrim = String(planForm.planTitle || '').trim()
	if (!titleTrim) throw new Error('请填写计划标题')

	const tid = getTeacherIdFromStorage()
	if (!tid) throw new Error('请先登录')

	const durParsed = parseInt(String(planForm.duration), 10)
	const duration = Number.isFinite(durParsed) && durParsed > 0 ? durParsed : 60

	if (!planId.value) {
		const createBody = {
			planTitle: titleTrim,
			planContent: String(planForm.planContent || '').trim(),
			planType: Number(planForm.planType) || 1,
			difficulty: Number(planForm.difficulty) || 1,
			duration,
			status: 0,
			teacherId: tid,
			teacherName: getTeacherNameFromStorage(),
		}
		if (lessonIdFromQuery.value > 0) createBody.lessonId = lessonIdFromQuery.value
		if (courseIdFromQuery.value > 0) createBody.courseId = courseIdFromQuery.value
		const newId = await createTeachingPlan(createBody)
		if (newId == null || !Number.isFinite(Number(newId))) {
			throw new Error('创建计划失败')
		}
		planId.value = String(newId)
		isNewMode.value = false
		navTitle.value = '训练计划'
		uni.setNavigationBarTitle({ title: '训练计划' })
		const d = await fetchTrainingPlanDetail(planId.value)
		planDetailRaw.value = d
		applyPlanDetailToForm(d)
		return
	}

	let d = planDetailRaw.value
	if (!d || d.id == null) {
		d = await fetchTrainingPlanDetail(planId.value)
		planDetailRaw.value = d
	}
	if (!d || d.id == null) throw new Error('无法获取计划信息')

	const lidQ = lessonIdFromQuery.value
	const cidQ = courseIdFromQuery.value
	const lidDetail = d.lessonId != null ? Number(d.lessonId) : NaN
	const cidDetail = d.courseId != null ? Number(d.courseId) : NaN
	const lessonId =
		Number.isFinite(lidQ) && lidQ > 0 ? lidQ : Number.isFinite(lidDetail) && lidDetail > 0 ? lidDetail : undefined
	const courseId =
		Number.isFinite(cidQ) && cidQ > 0 ? cidQ : Number.isFinite(cidDetail) && cidDetail > 0 ? cidDetail : undefined

	const body = {
		id: Number(d.id),
		planTitle: titleTrim,
		planContent: String(planForm.planContent || '').trim(),
		startTime: d.startTime,
		endTime: d.endTime,
		duration,
		planType: Number(planForm.planType) || 1,
		difficulty: Number(planForm.difficulty) || 1,
		status: d.status != null ? Number(d.status) : 0,
		teacherId: d.teacherId != null ? Number(d.teacherId) : tid,
		teacherName: d.teacherName || getTeacherNameFromStorage(),
	}
	if (lessonId != null) body.lessonId = lessonId
	if (courseId != null) body.courseId = courseId
	Object.keys(body).forEach((k) => {
		if (body[k] === undefined || body[k] === '') delete body[k]
	})
	await updateTeachingPlan(body)
}

async function onSave() {
	try {
		uni.showLoading({ title: '保存中…' })
		await persistPlanInfo()
		await loadProjectSummary()
		uni.hideLoading()
		uni.showToast({ title: '已保存', icon: 'success' })
	} catch (e) {
		uni.hideLoading()
		uni.showToast({ title: (e && e.message) || '保存失败', icon: 'none' })
	}
}

async function onSaveAndBack() {
	try {
		uni.showLoading({ title: '保存中…' })
		await persistPlanInfo()
		uni.hideLoading()
		uni.showToast({ title: '已保存', icon: 'success' })
		setTimeout(() => uni.navigateBack(), 500)
	} catch (e) {
		uni.hideLoading()
		uni.showToast({ title: (e && e.message) || '保存失败', icon: 'none' })
	}
}

onLoad((opt) => {
	planId.value = (opt && opt.planId) || ''
	const lid = opt && opt.lessonId != null && opt.lessonId !== '' ? parseInt(String(opt.lessonId), 10) : NaN
	lessonIdFromQuery.value = Number.isFinite(lid) && lid > 0 ? lid : 0
	const cid = opt && opt.courseId != null && opt.courseId !== '' ? parseInt(String(opt.courseId), 10) : NaN
	courseIdFromQuery.value = Number.isFinite(cid) && cid > 0 ? cid : 0
	try {
		lessonName.value = opt && opt.lessonName ? decodeURIComponent(opt.lessonName) : ''
	} catch {
		lessonName.value = (opt && opt.lessonName) || ''
	}
	try {
		courseName.value = opt && opt.courseName ? decodeURIComponent(opt.courseName) : ''
	} catch {
		courseName.value = (opt && opt.courseName) || ''
	}
	isNewMode.value = opt && opt.mode === 'new' && !planId.value
	navTitle.value = isNewMode.value ? '新建训练计划' : '训练计划'
	uni.setNavigationBarTitle({ title: navTitle.value })
	if (planId.value) loadData()
})

let infoPageShowCount = 0
onShow(() => {
	infoPageShowCount += 1
	if (infoPageShowCount === 1 || !planId.value) return
	loadProjectSummary()
})
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #f0f4f8;
	display: flex;
	flex-direction: column;
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.context-bar {
	margin: 16rpx 24rpx 0;
	padding: 16rpx 20rpx;
	background: #e6f7ff;
	border-radius: 12rpx;
	border: 1rpx solid #91caff;
}

.context-text {
	font-size: 24rpx;
	color: #1677ff;
}

.plan-edit-card {
	margin: 16rpx 24rpx 0;
	padding: 24rpx 20rpx;
	background: #fff;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	border: 1rpx solid #e6f4ff;
}

.plan-edit-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1677ff;
	display: block;
	margin-bottom: 20rpx;
}

.plan-edit-row {
	margin-bottom: 20rpx;
}

.plan-edit-label {
	font-size: 26rpx;
	color: #666;
	display: block;
	margin-bottom: 8rpx;
}

.plan-edit-input {
	width: 100%;
	box-sizing: border-box;
	min-height: 72rpx;
	padding: 14rpx 16rpx;
	font-size: 28rpx;
	background: #fafafa;
	border: 1rpx solid #e8e8e8;
	border-radius: 10rpx;
}

.plan-edit-textarea {
	width: 100%;
	box-sizing: border-box;
	min-height: 140rpx;
	padding: 14rpx 16rpx;
	font-size: 28rpx;
	background: #fafafa;
	border: 1rpx solid #e8e8e8;
	border-radius: 10rpx;
}

.plan-edit-picker {
	min-height: 72rpx;
	line-height: 72rpx;
	padding: 0 16rpx;
	font-size: 28rpx;
	background: #f0f9ff;
	border: 1rpx solid #91caff;
	border-radius: 10rpx;
	color: #333;
}

.projects-entry {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 8rpx;
	margin-bottom: 16rpx;
	padding: 24rpx 20rpx;
	background: linear-gradient(135deg, #f0f9ff, #e6fffb);
	border: 2rpx solid #91caff;
	border-radius: 14rpx;
}

.projects-entry.disabled {
	opacity: 0.55;
}

.projects-entry-main {
	flex: 1;
	min-width: 0;
}

.projects-entry-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1677ff;
	display: block;
	margin-bottom: 6rpx;
}

.projects-entry-sub {
	font-size: 24rpx;
	color: #666;
	display: block;
}

.projects-entry-arrow {
	font-size: 44rpx;
	color: #1677ff;
	line-height: 1;
	margin-left: 12rpx;
}

.plan-delete-plan-btn {
	margin-top: 4rpx;
	height: 76rpx;
	line-height: 76rpx;
	font-size: 28rpx;
	color: #ff4d4f;
	background: #fff2f0;
	border: 1rpx solid #ffccc7;
	border-radius: 10rpx;
}

.plan-delete-plan-btn::after {
	display: none;
}

.footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
	display: flex;
	justify-content: flex-end;
	gap: 16rpx;
}

.footer-btn {
	margin: 0;
	min-width: 160rpx;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 28rpx;
	border-radius: 40rpx;
	border: none;
	flex: 1;
	max-width: 320rpx;
}

.footer-btn::after {
	display: none;
}

.footer-btn.primary {
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	color: #fff;
}

.footer-btn.ghost {
	background: #f5f5f5;
	color: #666;
}
</style>
