<template>
	<view class="page">
		<page-nav-bar title="编辑训练项目" />
		<view v-if="loading" class="hint">加载中…</view>
		<view v-else class="form-card">
			<view class="form-row">
				<text class="label">项目名称</text>
				<input class="input" v-model="form.itemName" placeholder="必填" />
			</view>
			<view class="form-row">
				<text class="label">内容说明</text>
				<textarea class="textarea" v-model="form.itemContent" placeholder="选填" />
			</view>
			<view class="form-row">
				<text class="label">项目类型</text>
				<picker mode="selector" :range="itemTypeLabels" :value="itemTypeIndex" @change="onItemType">
					<view class="picker">{{ itemTypeLabels[itemTypeIndex] }}</view>
				</picker>
			</view>
			<view class="form-row">
				<text class="label">难度</text>
				<picker mode="selector" :range="difficultyLabels" :value="difficultyIndex" @change="onDifficulty">
					<view class="picker">{{ difficultyLabels[difficultyIndex] }}</view>
				</picker>
			</view>
			<view class="form-row">
				<text class="label">时长（分钟）</text>
				<input class="input" type="number" v-model="form.duration" />
			</view>
			<view class="form-row">
				<text class="label">满分</text>
				<input class="input" type="number" v-model="form.score" />
			</view>
			<view class="form-row">
				<text class="label">排序号</text>
				<input class="input" type="number" v-model="form.sortOrder" />
			</view>

			<button class="btn primary" :disabled="saving" @click="onSave">保存修改</button>
			<button
				v-if="form.id && effectivePlanId > 0"
				class="btn ghost"
				@click="goMaterial"
			>
				资料管理
			</button>
			<button v-if="form.id" class="btn danger" :disabled="deleting" @click="onDelete">
				删除项目
			</button>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
	fetchPlanProjectById,
	updatePlanProject,
	deletePlanProject,
	getTeacherIdFromStorage,
} from '../../services/trainingPlanApi.js'

const itemId = ref(0)
const planIdFromQuery = ref(0)
const planTitleFromQuery = ref('')
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({
	id: 0,
	planId: 0,
	teacherId: 0,
	itemName: '',
	itemContent: '',
	itemType: 1,
	difficulty: 1,
	duration: 20,
	score: 100,
	sortOrder: 1,
})

const itemTypeLabels = ['基础训练', '强化训练', '考核项目']
const difficultyLabels = ['简单', '中等', '困难']

const itemTypeIndex = computed(() => Math.max(0, Math.min(2, (Number(form.itemType) || 1) - 1)))
const difficultyIndex = computed(() => Math.max(0, Math.min(2, (Number(form.difficulty) || 1) - 1)))
const effectivePlanId = computed(() => {
	const a = Number(form.planId)
	if (Number.isFinite(a) && a > 0) return a
	const b = Number(planIdFromQuery.value)
	return Number.isFinite(b) && b > 0 ? b : 0
})

function applyDetail(d) {
	if (!d || typeof d !== 'object') return
	form.id = Number(d.id) || 0
	form.planId = d.planId != null ? Number(d.planId) : 0
	form.teacherId = d.teacherId != null ? Number(d.teacherId) : getTeacherIdFromStorage() || 0
	form.itemName = (d.itemName != null ? String(d.itemName) : '') || ''
	form.itemContent = d.itemContent != null ? String(d.itemContent) : ''
	form.itemType = d.itemType != null ? Number(d.itemType) : 1
	form.difficulty = d.difficulty != null ? Number(d.difficulty) : 1
	form.duration = d.duration != null ? Number(d.duration) : 20
	form.score = d.score != null ? Number(d.score) : 100
	form.sortOrder = d.sortOrder != null ? Number(d.sortOrder) : 1
	if (!Number.isFinite(form.itemType) || form.itemType < 1 || form.itemType > 3) form.itemType = 1
	if (!Number.isFinite(form.difficulty) || form.difficulty < 1 || form.difficulty > 3) form.difficulty = 1
}

function onItemType(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) form.itemType = i + 1
}

function onDifficulty(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) form.difficulty = i + 1
}

async function onSave() {
	const name = (form.itemName || '').trim()
	if (!name) {
		uni.showToast({ title: '请输入项目名称', icon: 'none' })
		return
	}
	if (!form.id) {
		uni.showToast({ title: '项目 id 无效', icon: 'none' })
		return
	}
	const tid = getTeacherIdFromStorage()
	if (!tid) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		return
	}
	const body = {
		id: form.id,
		teacherId: form.teacherId > 0 ? form.teacherId : tid,
		itemName: name,
		itemContent: (form.itemContent || '').trim(),
		itemType: form.itemType,
		difficulty: form.difficulty,
		duration: parseInt(String(form.duration), 10) || 20,
		score: parseInt(String(form.score), 10) || 100,
		sortOrder: parseInt(String(form.sortOrder), 10) || 1,
	}
	Object.keys(body).forEach((k) => {
		if (body[k] === undefined || body[k] === '') delete body[k]
	})
	try {
		saving.value = true
		uni.showLoading({ title: '保存中…' })
		await updatePlanProject(body)
		uni.hideLoading()
		uni.showToast({ title: '已保存', icon: 'success' })
		setTimeout(() => uni.navigateBack(), 500)
	} catch (e) {
		uni.hideLoading()
		uni.showToast({ title: (e && e.message) || '保存失败', icon: 'none' })
	} finally {
		saving.value = false
	}
}

function onDelete() {
	if (!form.id || deleting.value) return
	const name = (form.itemName || '').trim() || '该项目'
	uni.showModal({
		title: '确认删除',
		content: `确定要删除「${name}」吗？删除后无法恢复。`,
		confirmColor: '#ff4d4f',
		success: async (res) => {
			if (!res.confirm) return
			try {
				deleting.value = true
				uni.showLoading({ title: '删除中…' })
				await deletePlanProject(form.id)
				uni.hideLoading()
				uni.showToast({ title: '已删除', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 500)
			} catch (e) {
				uni.hideLoading()
				uni.showToast({ title: (e && e.message) || '删除失败', icon: 'none' })
			} finally {
				deleting.value = false
			}
		},
	})
}

function goMaterial() {
	const pid = effectivePlanId.value
	if (!pid) return
	const q = [
		`planId=${pid}`,
		`itemId=${form.id}`,
		`projectName=${encodeURIComponent(form.itemName || '')}`,
		`planTitle=${encodeURIComponent((planTitleFromQuery.value || '').trim() || '训练计划')}`,
	].join('&')
	uni.navigateTo({ url: `/pages/material-manage/material-manage?${q}` })
}

onLoad(async (opt) => {
	const id = opt && opt.itemId != null ? parseInt(String(opt.itemId), 10) : 0
	itemId.value = id
	if (!Number.isFinite(id) || id <= 0) {
		loading.value = false
		uni.showToast({ title: '缺少项目 id', icon: 'none' })
		setTimeout(() => uni.navigateBack(), 600)
		return
	}
	const qPlan = opt && opt.planId != null ? parseInt(String(opt.planId), 10) : 0
	if (Number.isFinite(qPlan) && qPlan > 0) {
		planIdFromQuery.value = qPlan
		form.planId = qPlan
	}
	try {
		planTitleFromQuery.value = opt && opt.planTitle ? decodeURIComponent(opt.planTitle) : ''
	} catch {
		planTitleFromQuery.value = (opt && opt.planTitle) || ''
	}
	const fallbackName = opt && opt.itemName ? decodeURIComponent(opt.itemName) : ''
	try {
		const d = await fetchPlanProjectById(id)
		applyDetail(d)
		if (fallbackName && !form.itemName) form.itemName = fallbackName
		if (qPlan > 0 && (!form.planId || form.planId <= 0)) form.planId = qPlan
	} catch (e) {
		uni.showToast({ title: (e && e.message) || '加载失败', icon: 'none' })
		if (fallbackName) form.itemName = fallbackName
		form.id = id
	} finally {
		loading.value = false
	}
})
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #f5f7fa;
	padding: 24rpx;
	box-sizing: border-box;
}

.hint {
	text-align: center;
	padding: 80rpx;
	color: #999;
	font-size: 28rpx;
}

.form-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx 24rpx 40rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.form-row {
	margin-bottom: 28rpx;
}

.label {
	display: block;
	font-size: 26rpx;
	color: #333;
	margin-bottom: 12rpx;
}

.input,
.picker {
	height: 80rpx;
	background: #f5f7fa;
	border-radius: 12rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	display: flex;
	align-items: center;
}

.textarea {
	min-height: 160rpx;
	width: 100%;
	box-sizing: border-box;
	background: #f5f7fa;
	border-radius: 12rpx;
	padding: 16rpx 20rpx;
	font-size: 28rpx;
}

.btn {
	margin-top: 20rpx;
	height: 88rpx;
	line-height: 88rpx;
	font-size: 30rpx;
	border-radius: 44rpx;
	border: none;
}

.btn::after {
	display: none;
}

.btn.primary {
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	color: #fff;
}

.btn.ghost {
	background: #fff;
	color: #07c160;
	border: 2rpx solid #07c160;
}

.btn.danger {
	background: #fff;
	color: #ff4d4f;
	border: 2rpx solid #ffccc7;
}

.btn[disabled] {
	opacity: 0.6;
}
</style>
