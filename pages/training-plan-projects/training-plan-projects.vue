<template>
	<view class="page">
		<page-nav-bar title="训练项目编排" />
		<view class="header-card">
			<text class="header-title">{{ planTitleDisplay }}</text>
			<text class="header-sub">{{ headerSubText }}</text>
		</view>

		<scroll-view scroll-y class="list-scroll" enable-flex>
			<view v-if="planItems.length === 0" class="empty-hint">
				<text>暂无训练项目，请从项目库添加或新建</text>
			</view>
			<view v-for="(item, index) in planItems" :key="item.id" class="plan-item-row">
				<text class="slot-num">{{ index + 1 }}</text>
				<view class="plan-item-main">
					<text class="item-name">{{ item.name }}</text>
					<text v-if="item.durationMin != null" class="item-dur">{{ item.durationMin }} 分钟</text>
				</view>
				<view class="row-actions">
					<text class="order-btn" :class="{ disabled: index <= 0 }" @click.stop="moveUp(index)">↑</text>
					<text class="order-btn" :class="{ disabled: index >= planItems.length - 1 }" @click.stop="moveDown(index)">↓</text>
					<text class="action-btn edit" @click.stop="goEditProject(item)">编辑</text>
					<text class="action-btn remove" @click.stop="removeAt(index)">移除</text>
				</view>
			</view>
		</scroll-view>

		<view class="add-bar">
			<button class="add-btn" @click="openCatalogSheet">＋ 从项目库添加</button>
			<button class="add-btn secondary" @click="openCreateProjectModal">＋ 新建训练项目</button>
		</view>

		<!-- 项目库底部弹层 -->
		<view v-if="showCatalog" class="sheet-mask" @click="closeCatalogSheet">
			<view class="sheet-panel" @click.stop>
				<view class="sheet-head">
					<text class="sheet-title">从项目库添加</text>
					<text class="sheet-close" @click="closeCatalogSheet">×</text>
				</view>
				<scroll-view scroll-y class="sheet-scroll">
					<view v-for="p in catalogItems" :key="p.id" class="catalog-row">
						<view class="catalog-info">
							<text class="catalog-name">{{ p.name }}</text>
							<text v-if="p.durationMin != null" class="catalog-meta">{{ p.durationMin }} 分钟</text>
						</view>
						<view class="catalog-actions">
							<text
								v-if="isInPlan(p.id)"
								class="catalog-tag added"
							>已添加</text>
							<text
								v-else-if="isCatalogItemAddable(p)"
								class="catalog-add"
								@click.stop="onAddFromCatalog(p)"
							>添加</text>
							<text v-if="isCatalogItemEditable(p)" class="catalog-edit" @click.stop="goEditProject(p)">编辑</text>
							<text v-if="isCatalogItemEditable(p)" class="catalog-delete" @click.stop="confirmDeleteProject(p)">删除</text>
						</view>
					</view>
					<view v-if="catalogItems.length === 0" class="sheet-empty">项目库为空，请先新建训练项目</view>
				</scroll-view>
			</view>
		</view>

		<!-- 创建训练项目 -->
		<view v-if="showCreateProject" class="modal-mask" @click="closeCreateProjectModal">
			<view class="modal-box" @click.stop>
				<view v-if="createProjectLoading" class="modal-loading" @click.stop>
					<view class="modal-loading-inner">
						<view class="loading-spinner" />
						<text class="modal-loading-text">{{ createProjectLoadingText }}</text>
					</view>
				</view>
				<view class="modal-head">
					<text class="modal-title">创建训练项目</text>
					<text class="modal-close" :class="{ disabled: createProjectLoading }" @click="closeCreateProjectModal">×</text>
				</view>
				<scroll-view scroll-y class="modal-body">
					<view class="form-row">
						<text class="form-label">项目名称</text>
						<input class="form-input" v-model="projectForm.itemName" placeholder="如：正手高远球" />
					</view>
					<view class="form-row">
						<text class="form-label">内容说明</text>
						<textarea class="form-textarea" v-model="projectForm.itemContent" placeholder="选填" />
					</view>
					<view class="form-row">
						<text class="form-label">项目类型</text>
						<picker mode="selector" :range="itemTypeLabels" :value="projectForm.itemType - 1" @change="onItemTypePick">
							<view class="form-picker">{{ itemTypeLabels[projectForm.itemType - 1] }}</view>
						</picker>
					</view>
					<view class="form-row">
						<text class="form-label">难度</text>
						<picker mode="selector" :range="difficultyLabels" :value="projectForm.difficulty - 1" @change="onDifficultyPick">
							<view class="form-picker">{{ difficultyLabels[projectForm.difficulty - 1] }}</view>
						</picker>
					</view>
					<view class="form-row">
						<text class="form-label">时长（分钟）</text>
						<input class="form-input" type="number" v-model="projectForm.duration" placeholder="20" />
					</view>
					<view class="form-row">
						<text class="form-label">满分</text>
						<input class="form-input" type="number" v-model="projectForm.score" placeholder="100" />
					</view>
					<view class="form-row">
						<text class="form-label">排序号</text>
						<input class="form-input" type="number" v-model="projectForm.sortOrder" placeholder="1" />
					</view>
					<view class="form-divider">项目资料（必填）</view>
					<view class="form-row">
						<text class="form-label">资料类型</text>
						<view class="type-segment">
							<view
								v-for="(label, idx) in materialTypeLabelsNew"
								:key="idx"
								class="type-segment-item"
								:class="{ active: projectForm.materialTypeNew === idx + 1 }"
								@click.stop="setMaterialTypeNew(idx + 1)"
							>
								{{ label }}
							</view>
						</view>
					</view>
					<view class="form-row">
						<text class="form-label">资料文件</text>
						<button class="btn-pick-file" type="default" @click.stop="chooseMaterialFile">
							{{ projectForm.materialTempPath ? '已选择，点击重选' : '选择图片或视频' }}
						</button>
					</view>
					<view class="form-row">
						<text class="form-label">资料标题</text>
						<input class="form-input" v-model="projectForm.materialTitle" placeholder="默认同项目名称" />
					</view>
					<view class="form-row">
						<text class="form-label">资料描述</text>
						<textarea class="form-textarea" v-model="projectForm.materialDescription" placeholder="选填" />
					</view>
				</scroll-view>
				<view class="modal-foot">
					<button class="btn-cancel" :disabled="createProjectLoading" @click="closeCreateProjectModal">取消</button>
					<button class="btn-ok" :disabled="createProjectLoading" @click="submitCreateProject">创建</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
	fetchTrainingProjectCatalogForArrange,
	fetchPlanProjectsByPlan,
	saveTrainingPlanArrangement,
	createPlanProject,
	createPlanProjectMinimal,
	associatePlanProject,
	disassociatePlanProject,
	deletePlanProject,
	createPlanMaterial,
	uploadPlanMaterialFile,
	extractPlanProjectItemId,
	getTeacherIdFromStorage,
} from '../../services/trainingPlanApi.js'

const planId = ref('')
const planTitleFromQuery = ref('')

/** 计划内项目 { id, name, durationMin } */
const planItems = ref([])
const catalogItems = ref([])

const showCatalog = ref(false)
const showCreateProject = ref(false)
const createProjectLoading = ref(false)
const createProjectLoadingText = ref('')

const projectForm = ref({
	itemName: '',
	itemContent: '',
	itemType: 1,
	difficulty: 1,
	duration: 20,
	score: 100,
	sortOrder: 1,
	materialTypeNew: 1,
	materialTempPath: '',
	materialTitle: '',
	materialDescription: '',
})

const itemTypeLabels = ['基础训练', '强化训练', '考核项目']
const difficultyLabels = ['简单', '中等', '困难']
const materialTypeLabelsNew = ['图片', '视频']

const planTitleDisplay = computed(() => {
	const t = (planTitleFromQuery.value || '').trim()
	return t || '训练计划'
})

const headerSubText = computed(() => {
	const n = planItems.value.length
	const total = planItems.value.reduce((s, p) => s + (p.durationMin != null ? Number(p.durationMin) : 0), 0)
	if (n <= 0) return '0 个项目'
	return `${n} 个项目${total > 0 ? ` · 共 ${total} 分钟` : ''}`
})

function mapPlanRowProjectFromApi(p) {
	if (!p || typeof p !== 'object') return null
	const id = p.id ?? p.itemId
	if (id == null) return null
	return {
		id: String(id),
		name: (p.itemName != null ? p.itemName : p.name) || '',
		durationMin: p.duration != null ? Number(p.duration) : p.durationMin != null ? Number(p.durationMin) : undefined,
	}
}

function sortPlanProjectsForDisplay(list) {
	if (!Array.isArray(list)) return []
	return [...list].sort((a, b) => {
		const sa = Number(a.sortOrder)
		const sb = Number(b.sortOrder)
		const ha = Number.isFinite(sa)
		const hb = Number.isFinite(sb)
		if (ha && hb && sa !== sb) return sa - sb
		if (ha && !hb) return -1
		if (!ha && hb) return 1
		const ida = Number(a.id ?? a.itemId)
		const idb = Number(b.id ?? b.itemId)
		if (Number.isFinite(ida) && Number.isFinite(idb) && ida !== idb) return ida - idb
		return 0
	})
}

function seedMockIfEmpty() {
	if (catalogItems.value.length) return
	if (getTeacherIdFromStorage() > 0) return
	catalogItems.value = [
		{ id: 'demo-a', name: '高远球', durationMin: 15, hasMaterials: true },
		{ id: 'demo-b', name: '杀球', durationMin: 20, hasMaterials: true },
		{ id: 'demo-c', name: '步伐', durationMin: 25, hasMaterials: true },
		{ id: 'demo-d', name: '多球', durationMin: 30, hasMaterials: false },
	]
}

function isCatalogItemEditable(p) {
	if (!p || p.id == null) return false
	const s = String(p.id)
	if (s.startsWith('demo-') || s.startsWith('tmp_') || s.startsWith('new_')) return false
	const n = parseInt(s, 10)
	return Number.isFinite(n) && n > 0
}

function isCatalogItemAddable(p) {
	if (!p || p.id == null) return false
	const s = String(p.id)
	if (s.startsWith('tmp_') || s.startsWith('new_')) return false
	return true
}

function isInPlan(itemId) {
	const sid = String(itemId)
	return planItems.value.some((x) => String(x.id) === sid)
}

async function loadData() {
	if (!planId.value) return
	try {
		const list = await fetchTrainingProjectCatalogForArrange(planId.value)
		catalogItems.value = Array.isArray(list) ? list : []
	} catch (_) {
		catalogItems.value = []
	}
	seedMockIfEmpty()

	try {
		const projectList = await fetchPlanProjectsByPlan(planId.value)
		const sorted = sortPlanProjectsForDisplay(projectList)
		planItems.value = sorted
			.map((p) => mapPlanRowProjectFromApi(p))
			.filter((x) => x && x.id)
	} catch (_) {
		planItems.value = []
	}
}

function openCatalogSheet() {
	showCatalog.value = true
}

function closeCatalogSheet() {
	showCatalog.value = false
}

async function moveUp(index) {
	if (index <= 0) return
	const arr = planItems.value
	const tmp = arr[index]
	arr[index] = arr[index - 1]
	arr[index - 1] = tmp
	planItems.value = [...arr]
	await persistArrangement()
}

async function moveDown(index) {
	if (index >= planItems.value.length - 1) return
	const arr = planItems.value
	const tmp = arr[index]
	arr[index] = arr[index + 1]
	arr[index + 1] = tmp
	planItems.value = [...arr]
	await persistArrangement()
}

async function removeAt(index) {
	const item = planItems.value[index]
	if (!item) return
	const sid = String(item.id)
	if (sid.startsWith('demo-') || sid.startsWith('tmp_') || sid.startsWith('new_')) {
		planItems.value = planItems.value.filter((_, i) => i !== index)
		return
	}
	const itemId = parseInt(sid, 10)
	if (!Number.isFinite(itemId) || itemId <= 0) return
	try {
		uni.showLoading({ title: '移除中…' })
		await disassociatePlanProject(itemId)
		planItems.value = planItems.value.filter((_, i) => i !== index)
		await persistArrangement()
		uni.showToast({ title: '已移除', icon: 'success' })
	} catch (err) {
		uni.showToast({ title: (err && err.message) || '移除失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}

function goEditProject(p) {
	if (!p || p.id == null) return
	if (!isCatalogItemEditable(p) && !planItems.value.some((x) => String(x.id) === String(p.id))) return
	const itemId = encodeURIComponent(String(p.id))
	const pid = encodeURIComponent(String(planId.value || ''))
	const nm = encodeURIComponent(String(p.name || ''))
	const pt = encodeURIComponent(planTitleDisplay.value)
	uni.navigateTo({
		url: `/pages/plan-project-edit/plan-project-edit?itemId=${itemId}&planId=${pid}&itemName=${nm}&planTitle=${pt}`,
		fail: () => uni.showToast({ title: '打开编辑页失败', icon: 'none' }),
	})
}

function confirmDeleteProject(p) {
	if (!isCatalogItemEditable(p)) return
	const itemId = parseInt(String(p.id), 10)
	if (!Number.isFinite(itemId) || itemId <= 0) return
	const name = (p.name || '').trim() || '该项目'
	uni.showModal({
		title: '确认删除',
		content: `确定要删除「${name}」吗？删除后无法恢复。`,
		confirmColor: '#ff4d4f',
		success: async (res) => {
			if (!res.confirm) return
			try {
				uni.showLoading({ title: '删除中…' })
				await deletePlanProject(itemId)
				const sid = String(p.id)
				catalogItems.value = catalogItems.value.filter((x) => String(x.id) !== sid)
				planItems.value = planItems.value.filter((x) => String(x.id) !== sid)
				uni.showToast({ title: '已删除', icon: 'success' })
			} catch (err) {
				uni.showToast({ title: (err && err.message) || '删除失败', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
	})
}

async function attachCatalogItemToPlan(item) {
	const name = (item && item.name ? String(item.name) : '').trim()
	if (!name) {
		uni.showToast({ title: '项目名称为空', icon: 'none' })
		return
	}
	const pid = parseInt(String(planId.value), 10)
	if (!pid) {
		uni.showToast({ title: '计划 id 无效', icon: 'none' })
		return
	}
	const tid = getTeacherIdFromStorage()
	if (!tid) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		return
	}
	if (isInPlan(item.id)) {
		uni.showToast({ title: '计划中已有该项', icon: 'none' })
		return
	}
	try {
		uni.showLoading({ title: '处理中…' })
		if (String(item.id).startsWith('demo-')) {
			await createPlanProjectMinimal(pid, name)
			uni.showToast({ title: '已加入计划', icon: 'success' })
			await loadData()
			return
		}
		const itemId = parseInt(String(item.id), 10)
		if (!Number.isFinite(itemId)) {
			uni.showToast({ title: '项目数据无效', icon: 'none' })
			return
		}
		await associatePlanProject(itemId, pid)
		planItems.value.push({
			id: String(itemId),
			name,
			durationMin: item.durationMin != null ? Number(item.durationMin) : undefined,
		})
		await persistArrangement()
		uni.showToast({ title: '已加入计划', icon: 'success' })
	} catch (err) {
		uni.showToast({ title: (err && err.message) || '操作失败', icon: 'none', duration: 2500 })
	} finally {
		uni.hideLoading()
	}
}

async function onAddFromCatalog(p) {
	await attachCatalogItemToPlan(p)
}

function openCreateProjectModal() {
	projectForm.value = {
		itemName: '',
		itemContent: '',
		itemType: 1,
		difficulty: 1,
		duration: 20,
		score: 100,
		sortOrder: catalogItems.value.filter((x) => !String(x.id).startsWith('demo-')).length + 1,
		materialTypeNew: 1,
		materialTempPath: '',
		materialTitle: '',
		materialDescription: '',
	}
	showCreateProject.value = true
}

function closeCreateProjectModal() {
	if (createProjectLoading.value) return
	showCreateProject.value = false
}

function setCreateProjectLoading(text) {
	createProjectLoadingText.value = text
	createProjectLoading.value = true
}

function clearCreateProjectLoading() {
	createProjectLoading.value = false
	createProjectLoadingText.value = ''
}

function onItemTypePick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) projectForm.value.itemType = i + 1
}

function onDifficultyPick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) projectForm.value.difficulty = i + 1
}

function setMaterialTypeNew(type) {
	if (projectForm.value.materialTypeNew === type) return
	projectForm.value.materialTypeNew = type
	projectForm.value.materialTempPath = ''
}

function chooseMaterialFile() {
	const mt = projectForm.value.materialTypeNew
	if (mt === 1) {
		uni.chooseImage({
			count: 1,
			success: (res) => {
				projectForm.value.materialTempPath = res.tempFilePaths[0]
			},
		})
	} else {
		uni.chooseVideo({
			success: (res) => {
				projectForm.value.materialTempPath = res.tempFilePath
			},
		})
	}
}

function urlsFromUploadData(data, materialType) {
	if (!data || typeof data !== 'object') {
		return { imageUrl: '', videoUrl: '' }
	}
	const generic = data.url || data.fileUrl || data.accessUrl || data.path
	if (materialType === 1) {
		const imageUrl = String(data.imageUrl || data.imgUrl || generic || '')
		return { imageUrl, videoUrl: '' }
	}
	const videoUrl = String(data.videoUrl || generic || '')
	const imageUrl = String(data.imageUrl || data.posterUrl || data.coverUrl || '')
	return { imageUrl, videoUrl }
}

async function submitCreateProject() {
	const name = (projectForm.value.itemName || '').trim()
	if (!name) {
		uni.showToast({ title: '请输入项目名称', icon: 'none' })
		return
	}
	if (!projectForm.value.materialTempPath) {
		uni.showToast({ title: '请选择项目资料文件', icon: 'none' })
		return
	}
	const tid = getTeacherIdFromStorage()
	if (!tid) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		return
	}
	const pid = parseInt(String(planId.value), 10)
	const hasPlanId = Number.isFinite(pid) && pid > 0
	const mt = projectForm.value.materialTypeNew
	const duration = parseInt(String(projectForm.value.duration), 10) || 20
	const score = parseInt(String(projectForm.value.score), 10) || 100
	const sortOrder = parseInt(String(projectForm.value.sortOrder), 10) || 1

	const payload = {
		teacherId: tid,
		itemName: name,
		itemContent: (projectForm.value.itemContent || '').trim(),
		itemType: projectForm.value.itemType,
		difficulty: projectForm.value.difficulty,
		duration,
		score,
		sortOrder,
	}

	let createStage = 'init'
	try {
		setCreateProjectLoading('正在创建项目…')
		createStage = 'createPlanProject'
		const createdId = await createPlanProject(payload)
		const itemId = extractPlanProjectItemId(createdId)
		if (!itemId) throw new Error('创建成功但未返回项目 id')

		setCreateProjectLoading('正在上传资料…')
		createStage = 'uploadPlanMaterialFile'
		const uploadData = await uploadPlanMaterialFile({
			filePath: projectForm.value.materialTempPath,
			...(hasPlanId ? { planId: pid } : {}),
			itemId,
			materialType: mt,
			title: (projectForm.value.materialTitle || '').trim() || name,
			description: (projectForm.value.materialDescription || '').trim(),
		})
		const { imageUrl, videoUrl } = urlsFromUploadData(uploadData, mt)
		if (!imageUrl && !videoUrl) throw new Error('上传未返回文件地址，无法登记资料')

		setCreateProjectLoading('正在登记资料…')
		createStage = 'createPlanMaterial'
		const matBody = {
			...(hasPlanId ? { planId: pid } : {}),
			itemId,
			materialType: mt,
			sortOrder: 0,
			title: (projectForm.value.materialTitle || '').trim() || name,
			description: (projectForm.value.materialDescription || '').trim() || undefined,
		}
		if (imageUrl) matBody.imageUrl = imageUrl
		if (videoUrl) matBody.videoUrl = videoUrl
		if (uploadData && uploadData.duration != null) {
			matBody.duration = Number(uploadData.duration)
		}
		await createPlanMaterial(matBody)

		closeCreateProjectModal()
		await loadData()
		uni.showToast({ title: '创建成功', icon: 'success' })
	} catch (err) {
		const msg = err && err.message ? err.message : '创建失败'
		console.error('[submitCreateProject] failed', { stage: createStage, message: msg, err })
		uni.showToast({ title: msg, icon: 'none', duration: 2800 })
	} finally {
		clearCreateProjectLoading()
	}
}

async function persistArrangement() {
	const slots = planItems.value.map((p) => ({ project: p }))
	try {
		await saveTrainingPlanArrangement({
			planId: planId.value,
			slots,
		})
	} catch (e) {
		uni.showToast({ title: (e && e.message) || '排序保存失败', icon: 'none' })
	}
}

onLoad((opt) => {
	planId.value = (opt && opt.planId) || ''
	try {
		planTitleFromQuery.value = opt && opt.planTitle ? decodeURIComponent(opt.planTitle) : ''
	} catch {
		planTitleFromQuery.value = (opt && opt.planTitle) || ''
	}
	if (!planId.value) {
		uni.showToast({ title: '计划 id 无效', icon: 'none' })
		setTimeout(() => uni.navigateBack(), 800)
		return
	}
	uni.setNavigationBarTitle({ title: '训练项目编排' })
	loadData()
})

let projectsPageShowCount = 0
onShow(() => {
	if (!planId.value) return
	projectsPageShowCount += 1
	if (projectsPageShowCount === 1) return
	loadData()
})
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #f0f4f8;
	display: flex;
	flex-direction: column;
	padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.header-card {
	margin: 16rpx 24rpx 0;
	padding: 20rpx 24rpx;
	background: #fff;
	border-radius: 16rpx;
	border: 1rpx solid #e6f4ff;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.header-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.header-sub {
	font-size: 24rpx;
	color: #666;
	display: block;
}

.list-scroll {
	flex: 1;
	margin: 16rpx 24rpx 0;
	max-height: calc(100vh - 420rpx);
}

.empty-hint {
	padding: 48rpx 24rpx;
	text-align: center;
	font-size: 26rpx;
	color: #999;
}

.plan-item-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 20rpx 16rpx;
	margin-bottom: 16rpx;
	background: #fff;
	border-radius: 14rpx;
	border: 1rpx solid #e6f4ff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.slot-num {
	width: 40rpx;
	height: 40rpx;
	line-height: 40rpx;
	text-align: center;
	font-size: 24rpx;
	color: #1677ff;
	font-weight: 600;
	background: #e6f4ff;
	border-radius: 8rpx;
	flex-shrink: 0;
}

.plan-item-main {
	flex: 1;
	min-width: 0;
}

.item-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-dur {
	font-size: 22rpx;
	color: #888;
	margin-top: 4rpx;
	display: block;
}

.row-actions {
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex-shrink: 0;
	flex-wrap: wrap;
	justify-content: flex-end;
	max-width: 280rpx;
}

.order-btn {
	width: 44rpx;
	height: 44rpx;
	line-height: 44rpx;
	text-align: center;
	font-size: 26rpx;
	color: #1677ff;
	background: #e6f4ff;
	border-radius: 8rpx;
}

.order-btn.disabled {
	opacity: 0.35;
	pointer-events: none;
}

.action-btn {
	font-size: 22rpx;
	padding: 6rpx 12rpx;
	border-radius: 8rpx;
}

.action-btn.edit {
	color: #1677ff;
	background: #f0f9ff;
	border: 1rpx solid #91caff;
}

.action-btn.remove {
	color: #ff4d4f;
	background: #fff2f0;
	border: 1rpx solid #ffccc7;
}

.add-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
	background: #fff;
	border-top: 1rpx solid #f0f0f0;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.add-btn {
	margin: 0;
	height: 72rpx;
	line-height: 72rpx;
	font-size: 28rpx;
	border-radius: 36rpx;
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	color: #fff;
	border: none;
}

.add-btn.secondary {
	background: #f0f9ff;
	color: #1677ff;
	border: 1rpx solid #91caff;
}

.add-btn::after {
	display: none;
}

.sheet-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 2000;
	display: flex;
	align-items: flex-end;
}

.sheet-panel {
	width: 100%;
	max-height: 70vh;
	background: #fff;
	border-radius: 24rpx 24rpx 0 0;
	display: flex;
	flex-direction: column;
}

.sheet-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.sheet-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.sheet-close {
	font-size: 44rpx;
	color: #999;
	padding: 8rpx;
	line-height: 1;
}

.sheet-scroll {
	flex: 1;
	max-height: 60vh;
	padding: 16rpx 24rpx 32rpx;
	box-sizing: border-box;
}

.catalog-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
	gap: 16rpx;
}

.catalog-info {
	flex: 1;
	min-width: 0;
}

.catalog-name {
	font-size: 28rpx;
	color: #333;
	display: block;
}

.catalog-meta {
	font-size: 22rpx;
	color: #999;
	margin-top: 4rpx;
	display: block;
}

.catalog-actions {
	display: flex;
	align-items: center;
	gap: 10rpx;
	flex-shrink: 0;
}

.catalog-add {
	font-size: 24rpx;
	color: #07c160;
	padding: 6rpx 16rpx;
	background: #f6ffed;
	border: 1rpx solid #95de64;
	border-radius: 8rpx;
}

.catalog-tag.added {
	font-size: 22rpx;
	color: #999;
}

.catalog-edit {
	font-size: 22rpx;
	color: #1677ff;
}

.catalog-delete {
	font-size: 22rpx;
	color: #ff4d4f;
}

.sheet-empty {
	padding: 40rpx;
	text-align: center;
	font-size: 26rpx;
	color: #999;
}

.modal-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 3000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
	box-sizing: border-box;
}

.modal-box {
	position: relative;
	width: 100%;
	max-width: 640rpx;
	max-height: 85vh;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.modal-loading {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 20;
	background: rgba(255, 255, 255, 0.88);
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-loading-inner {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24rpx;
	padding: 40rpx;
}

.loading-spinner {
	width: 72rpx;
	height: 72rpx;
	border: 6rpx solid #e8e8e8;
	border-top-color: #07c160;
	border-radius: 50%;
	animation: spin 0.75s linear infinite;
}

.modal-loading-text {
	font-size: 28rpx;
	color: #333;
	text-align: center;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.modal-close.disabled {
	opacity: 0.35;
	pointer-events: none;
}

.modal-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.modal-body {
	max-height: 56vh;
	padding: 24rpx;
	box-sizing: border-box;
}

.type-segment {
	display: flex;
	gap: 16rpx;
}

.type-segment-item {
	flex: 1;
	height: 76rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f7fa;
	border-radius: 10rpx;
	font-size: 28rpx;
	color: #666;
	border: 2rpx solid transparent;
}

.type-segment-item.active {
	background: #e8f8ef;
	color: #07c160;
	border-color: #07c160;
	font-weight: 600;
}

.form-row {
	margin-bottom: 24rpx;
}

.form-label {
	display: block;
	font-size: 26rpx;
	color: #333;
	margin-bottom: 12rpx;
}

.form-input,
.form-picker {
	height: 76rpx;
	background: #f5f7fa;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: #333;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	width: 100%;
}

.form-textarea {
	min-height: 140rpx;
	width: 100%;
	box-sizing: border-box;
	background: #f5f7fa;
	border-radius: 10rpx;
	padding: 16rpx 20rpx;
	font-size: 28rpx;
	color: #333;
}

.form-divider {
	font-size: 26rpx;
	color: #1677ff;
	font-weight: 600;
	margin: 12rpx 0 8rpx;
	padding-top: 8rpx;
	border-top: 1rpx solid #f0f0f0;
}

.btn-pick-file {
	width: 100%;
	height: 72rpx;
	line-height: 72rpx;
	font-size: 26rpx;
	background: #f5f7fa;
	color: #333;
	border-radius: 10rpx;
	border: 1rpx solid #e8e8e8;
	margin: 0;
}

.btn-pick-file::after {
	display: none;
}

.modal-foot {
	display: flex;
	gap: 20rpx;
	padding: 20rpx 24rpx 32rpx;
	border-top: 1rpx solid #f0f0f0;
}

.modal-foot button {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 30rpx;
	border-radius: 10rpx;
	border: none;
	margin: 0;
}

.modal-foot button::after {
	display: none;
}

.btn-cancel {
	background: #f5f5f5;
	color: #666;
}

.btn-ok {
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	color: #fff;
}

.modal-foot button[disabled] {
	opacity: 0.5;
}
</style>
