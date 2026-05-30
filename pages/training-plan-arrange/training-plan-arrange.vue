<template>
	<view class="page">
		<!-- 编辑训练计划（教学计划基本信息） -->
		<view v-if="planId" class="plan-edit-card">
			<text class="plan-edit-title">编辑训练计划</text>
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
			<button class="plan-delete-plan-btn" @click="confirmDeleteTrainingPlan">删除训练计划</button>
		</view>

		<view class="main">
			<!-- 左侧：项目列表 -->
			<view class="col left">
				<text class="col-title">项目列表</text>
				<view class="side-note">
					<text class="side-note-line">已有项目</text>
					<text class="side-note-line sub">带资料 · 可编辑时长</text>
				</view>
				<scroll-view scroll-y class="left-scroll" enable-flex>
					<view
						v-for="p in catalogItems"
						:key="p.id"
						class="lib-card"
						:class="{ dragging: draggingCatalogId === p.id }"
						:data-id="p.id"
						@touchstart="onCatalogTouchStart($event, p)"
						@touchmove="onCatalogTouchMove"
						@touchend="onCatalogTouchEnd"
						@touchcancel="onCatalogTouchCancel"
					>
						<text class="lib-name">{{ p.name }}</text>
						<text v-if="p.durationMin != null" class="lib-meta">{{ p.durationMin }} 分钟</text>
						<view v-if="isCatalogItemEditable(p)" class="lib-edit-wrap" @click.stop>
							<text class="lib-edit-btn" @click.stop="goEditProject(p)">编辑</text>
							<text class="lib-delete-btn" @click.stop="confirmDeleteProject(p)">删除</text>
						</view>
					</view>
					<text class="lib-hint">拖入或点在右侧计划区内：加入当前计划</text>
				</scroll-view>
				<view class="new-block">
					<text class="side-note-line only">新建项目</text>
					<view class="lib-card new" @click="openCreateProjectModal">
						<text class="lib-name">＋ 新建</text>
						<text class="lib-meta sub">可上传资料，编辑时长</text>
					</view>
				</view>
			</view>

			<!-- 右侧：计划区 -->
			<view class="col right">
				<text class="col-title">计划区</text>
				<text class="zone-hint">区内上下滑动条目可调整顺序</text>
				<view id="plan-drop-zone" class="plan-zone">
					<view
						v-for="(row, index) in planRows"
						:key="row._key"
						class="plan-row"
						:class="{ empty: !row.project, ghost: dragPlanFromIndex === index }"
						@touchstart="onPlanRowTouchStart($event, index)"
						@touchend="onPlanRowTouchEnd($event, index)"
					>
						<text class="slot-num">{{ index + 1 }}</text>
						<view v-if="row.project" class="plan-chip">
							<text class="chip-text">{{ row.project.name }}</text>
							<text v-if="row.project.durationMin != null" class="chip-dur">{{ row.project.durationMin }}′</text>
						</view>
						<text v-else class="placeholder">拖入项目</text>
						<text
							v-if="row.project"
							class="remove-x"
							@click.stop="removeAt(index)"
						>×</text>
					</view>
				</view>
			</view>
		</view>

		<view class="footer">
			<button class="save-btn" type="primary" @click="onSave">保存</button>
		</view>

		<!-- 创建训练项目 -->
		<view v-if="showCreateProject" class="modal-mask" @click="closeCreateProjectModal">
			<view class="modal-box" @click.stop>
				<view class="modal-head">
					<text class="modal-title">创建训练项目</text>
					<text class="modal-close" @click="closeCreateProjectModal">×</text>
				</view>
				<scroll-view scroll-y class="modal-body">
					<view class="form-row">
						<text class="form-label">项目名称</text>
						<input
							class="form-input"
							v-model="projectForm.itemName"
							placeholder="如：正手高远球"
						/>
					</view>
					<view class="form-row">
						<text class="form-label">内容说明</text>
						<textarea
							class="form-textarea"
							v-model="projectForm.itemContent"
							placeholder="选填"
						/>
					</view>
					<view class="form-row">
						<text class="form-label">项目类型</text>
						<picker mode="selector" :range="itemTypeLabels" @change="onItemTypePick">
							<view class="form-picker">{{ itemTypeLabels[projectForm.itemType - 1] }}</view>
						</picker>
					</view>
					<view class="form-row">
						<text class="form-label">难度</text>
						<picker mode="selector" :range="difficultyLabels" @change="onDifficultyPick">
							<view class="form-picker">{{ difficultyLabels[projectForm.difficulty - 1] }}</view>
						</picker>
					</view>
					<view class="form-row">
						<text class="form-label">时长（分钟）</text>
						<input
							class="form-input"
							type="number"
							v-model="projectForm.duration"
							placeholder="20"
						/>
					</view>
					<view class="form-row">
						<text class="form-label">满分</text>
						<input
							class="form-input"
							type="number"
							v-model="projectForm.score"
							placeholder="100"
						/>
					</view>
					<view class="form-row">
						<text class="form-label">排序号</text>
						<input
							class="form-input"
							type="number"
							v-model="projectForm.sortOrder"
							placeholder="1"
						/>
					</view>
					<view class="form-divider">项目资料（必填）</view>
					<view class="form-row">
						<text class="form-label">资料类型</text>
						<picker mode="selector" :range="materialTypeLabelsNew" @change="onMaterialTypeNewPick">
							<view class="form-picker">{{ materialTypeLabelsNew[projectForm.materialTypeNew - 1] }}</view>
						</picker>
					</view>
					<view class="form-row">
						<text class="form-label">资料文件</text>
						<button class="btn-pick-file" type="default" @click.stop="chooseMaterialFile">
							{{ projectForm.materialTempPath ? '已选择，点击重选' : '选择图片或视频' }}
						</button>
					</view>
					<view class="form-row">
						<text class="form-label">资料标题</text>
						<input
							class="form-input"
							v-model="projectForm.materialTitle"
							placeholder="默认同项目名称"
						/>
					</view>
					<view class="form-row">
						<text class="form-label">资料描述</text>
						<textarea
							class="form-textarea"
							v-model="projectForm.materialDescription"
							placeholder="选填"
						/>
					</view>
				</scroll-view>
				<view class="modal-foot">
					<button class="btn-cancel" @click="closeCreateProjectModal">取消</button>
					<button class="btn-ok" @click="submitCreateProject">创建</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
	fetchTrainingProjectCatalogForArrange,
	fetchTrainingPlanDetail,
	saveTrainingPlanArrangement,
	createPlanProject,
	createPlanProjectMinimal,
	associatePlanProject,
	deletePlanProject,
	createPlanMaterial,
	uploadPlanMaterialFile,
	extractPlanProjectItemId,
	createTrainingPlanDraft,
	fetchPlanProjectsByPlan,
	getTeacherIdFromStorage,
	getTeacherNameFromStorage,
	updateTeachingPlan,
	deleteTeachingPlan,
} from '../../services/trainingPlanApi.js'

const planId = ref('')
const isNew = ref(true)

/** 从进入页 query 带入，保存计划时一并写回（与课堂绑定一致） */
const lessonIdFromQuery = ref(0)
const courseIdFromQuery = ref(0)

/** 最近一次 GET 计划详情，用于 PUT 时保留 id / 时间 / 教师等未在表单展示的字段 */
const planDetailRaw = ref(null)

const planForm = reactive({
	planTitle: '',
	planContent: '',
	duration: 60,
	planType: 1,
	difficulty: 1,
})

const planTypeLabels = ['常规', '专项', '测试']
const planDifficultyLabels = ['简单', '中等', '困难']

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

async function loadPlanEditSection() {
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

function onPlanTypePick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) planForm.planType = i + 1
}

function onPlanDifficultyPick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) planForm.difficulty = i + 1
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

/** 提交计划基本信息（无 toast；校验或接口失败时 throw） */
async function persistPlanInfo() {
	if (!planId.value) return
	let d = planDetailRaw.value
	if (!d || d.id == null) {
		try {
			d = await fetchTrainingPlanDetail(planId.value)
			planDetailRaw.value = d
		} catch (_) {
			d = null
		}
	}
	if (!d || d.id == null) {
		throw new Error('无法获取计划信息')
	}
	const titleTrim = String(planForm.planTitle || '').trim()
	if (!titleTrim) {
		throw new Error('请填写计划标题')
	}
	const tid = getTeacherIdFromStorage()
	const durParsed = parseInt(String(planForm.duration), 10)
	const duration =
		Number.isFinite(durParsed) && durParsed > 0
			? durParsed
			: d.duration != null
				? Number(d.duration)
				: 60
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

const catalogItems = ref([])

/** 每行 { _key, project: { id, name, durationMin } | null } */
const planRows = ref([])

const draggingCatalogId = ref(null)
const dragCatalogStart = ref({ x: 0, y: 0 })
let catalogMoved = false

const dragPlanFromIndex = ref(-1)
const planRowTouchStartY = ref(0)

const showCreateProject = ref(false)
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

function genKey() {
	return `k_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function ensureTrailingEmpty() {
	const last = planRows.value[planRows.value.length - 1]
	if (!last || last.project != null) {
		planRows.value.push({ _key: genKey(), project: null })
	}
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

function goEditProject(p) {
	if (!isCatalogItemEditable(p)) return
	const itemId = encodeURIComponent(String(p.id))
	const pid = encodeURIComponent(String(planId.value || ''))
	const nm = encodeURIComponent(String(p.name || ''))
	uni.navigateTo({
		url: `/pages/plan-project-edit/plan-project-edit?itemId=${itemId}&planId=${pid}&itemName=${nm}`,
		fail: () => {
			uni.showToast({ title: '打开编辑页失败', icon: 'none' })
		},
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
				planRows.value = planRows.value.map((r) =>
					r.project && String(r.project.id) === sid ? { ...r, project: null } : r,
				)
				ensureTrailingEmpty()
				uni.showToast({ title: '已删除', icon: 'success' })
			} catch (err) {
				uni.showToast({
					title: (err && err.message) || '删除失败',
					icon: 'none',
				})
			} finally {
				uni.hideLoading()
			}
		},
	})
}

function addProjectToFirstEmpty(project) {
	ensureTrailingEmpty()
	const idx = planRows.value.findIndex((r) => !r.project)
	if (idx >= 0) {
		planRows.value[idx] = { _key: planRows.value[idx]._key, project: { ...project } }
	} else {
		planRows.value.push({ _key: genKey(), project: { ...project } })
	}
	ensureTrailingEmpty()
}

/** 点击/拖入左侧：演示项走新建+关联；已有服务端 id 走 associate-plan */
async function attachCatalogItemToPlan(item) {
	const name = (item && item.name ? String(item.name) : '').trim()
	if (!name) {
		uni.showToast({ title: '项目名称为空', icon: 'none' })
		return
	}
	const pid = parseInt(String(planId.value), 10)
	if (!pid) {
		uni.showToast({ title: '请先进入有 planId 的计划页', icon: 'none' })
		return
	}
	const tid = getTeacherIdFromStorage()
	if (!tid) {
		uni.showToast({ title: '请先登录', icon: 'none' })
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
		const onPlan = await fetchPlanProjectsByPlan(pid)
		const dup = (Array.isArray(onPlan) ? onPlan : []).some((x) => Number(x.id) === itemId)
		if (dup) {
			uni.showToast({ title: '计划中已有该项', icon: 'none' })
			return
		}
		await associatePlanProject(itemId, pid)
		uni.showToast({ title: '已加入计划', icon: 'success' })
		await loadData()
	} catch (err) {
		const msg = err && err.message ? err.message : '操作失败'
		uni.showToast({ title: msg, icon: 'none', duration: 2500 })
	} finally {
		uni.hideLoading()
	}
}

function isPointInPlanZone(clientX, clientY) {
	return new Promise((resolve) => {
		uni.createSelectorQuery()
			.select('#plan-drop-zone')
			.boundingClientRect()
			.exec((res) => {
				const rect = res && res[0]
				if (!rect || typeof rect.left !== 'number') {
					resolve(false)
					return
				}
				const inside =
					clientX >= rect.left &&
					clientX <= rect.right &&
					clientY >= rect.top &&
					clientY <= rect.bottom
				resolve(inside)
			})
	})
}

function onCatalogTouchStart(e, p) {
	draggingCatalogId.value = p.id
	catalogMoved = false
	const t = e.touches[0]
	dragCatalogStart.value = { x: t.clientX, y: t.clientY }
}

function onCatalogTouchMove(e) {
	if (!draggingCatalogId.value) return
	const t = e.touches[0]
	const dx = t.clientX - dragCatalogStart.value.x
	const dy = t.clientY - dragCatalogStart.value.y
	if (Math.abs(dx) + Math.abs(dy) > 12) catalogMoved = true
}

async function onCatalogTouchEnd(e) {
	const id = draggingCatalogId.value
	draggingCatalogId.value = null
	if (!id) return
	const t = e.changedTouches[0]
	const inside = await isPointInPlanZone(t.clientX, t.clientY)
	const item = catalogItems.value.find((x) => x.id === id)
	if (!item) {
		catalogMoved = false
		return
	}
	// 仅拖入/释放在计划区内时关联，避免点「编辑」等触发的 tap 误调 associate-plan
	if (inside) {
		await attachCatalogItemToPlan(item)
	}
	catalogMoved = false
}

function onCatalogTouchCancel() {
	draggingCatalogId.value = null
	catalogMoved = false
}

function onPlanRowTouchStart(e, index) {
	const row = planRows.value[index]
	if (!row?.project) return
	dragPlanFromIndex.value = index
	const t = e.touches[0]
	planRowTouchStartY.value = t.clientY
}

function swapRows(i, j) {
	const a = planRows.value[i]
	const b = planRows.value[j]
	if (!a || !b) return
	if (!a.project || !b.project) return
	const tmp = a.project
	a.project = b.project
	b.project = tmp
}

function onPlanRowTouchEnd(e, index) {
	if (dragPlanFromIndex.value !== index) return
	const t = e.changedTouches[0]
	const dy = t.clientY - planRowTouchStartY.value
	dragPlanFromIndex.value = -1
	const cur = planRows.value[index]
	if (!cur?.project) return
	if (dy < -36 && index > 0) {
		swapRows(index, index - 1)
	} else if (dy > 36 && index < planRows.value.length - 1) {
		const next = planRows.value[index + 1]
		if (next?.project) swapRows(index, index + 1)
		else if (next && !next.project) {
			next.project = cur.project
			cur.project = null
		}
	}
}

function removeAt(index) {
	const row = planRows.value[index]
	if (!row?.project) return
	row.project = null
	const filled = planRows.value.filter((r) => r.project)
	planRows.value = [...filled, { _key: genKey(), project: null }]
}

/** 将接口里的训练项目转为计划区 project 结构 */
function mapPlanRowProjectFromApi(p) {
	if (!p || typeof p !== 'object') return null
	const id = p.id ?? p.itemId
	return {
		id: id != null ? String(id) : '',
		name: (p.itemName != null ? p.itemName : p.name) || '',
		durationMin: p.duration != null ? Number(p.duration) : p.durationMin != null ? Number(p.durationMin) : undefined,
	}
}

/**
 * 从教学计划详情解析右侧计划区行（优先 slots；否则从常见字段取项目列表并按 sortOrder）
 */
function planSlotsFromDetail(detail) {
	if (!detail || typeof detail !== 'object') return []
	if (Array.isArray(detail.slots)) {
		return detail.slots.map((s) => {
			const raw = s && (s.project || s.item || s.planProject)
			return { project: raw ? mapPlanRowProjectFromApi(raw) : null }
		})
	}
	const keys = [
		'planProjects',
		'planProjectList',
		'planProjectRespVOList',
		'projects',
		'items',
		'children',
	]
	let list = []
	for (const k of keys) {
		if (Array.isArray(detail[k])) {
			list = detail[k]
			break
		}
	}
	if (!list.length) return []
	return [...list]
		.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
		.map((p) => ({ project: mapPlanRowProjectFromApi(p) }))
}

/**
 * 按计划内训练项目列表构建右侧行（按 sortOrder，其次 id）
 */
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

function planRowsFromProjectList(list, currentPlanId) {
	const pid =
		currentPlanId != null && currentPlanId !== ''
			? Number(String(currentPlanId))
			: NaN
	const hasPid = Number.isFinite(pid) && pid > 0
	const sorted = sortPlanProjectsForDisplay(list)
	const rows = []
	for (const p of sorted) {
		if (hasPid && p.planId != null && Number(p.planId) !== pid) continue
		const project = mapPlanRowProjectFromApi(p)
		if (project && project.id) rows.push({ _key: genKey(), project })
	}
	return rows
}

async function loadData() {
	catalogItems.value = []
	if (planId.value) {
		await loadPlanEditSection()
	} else {
		planDetailRaw.value = null
	}
	try {
		const list = await fetchTrainingProjectCatalogForArrange(planId.value || undefined)
		if (Array.isArray(list) && list.length) catalogItems.value = list
	} catch (_) {}
	seedMockIfEmpty()

	// 有计划 id：优先用「按计划的训练项目列表」按顺序填充右侧（与 list-by-plan 一致）
	if (planId.value) {
		try {
			const projectList = await fetchPlanProjectsByPlan(planId.value)
			const rows = planRowsFromProjectList(projectList, planId.value)
			if (rows.length > 0) {
				planRows.value = rows
				ensureTrailingEmpty()
				return
			}
		} catch (_) {}

		// 回退：计划详情里嵌套的项目 / slots
		try {
			const detail = await fetchTrainingPlanDetail(planId.value)
			const slots = planSlotsFromDetail(detail)
			if (slots.length && slots.some((s) => s.project)) {
				planRows.value = slots.map((s) => ({
					_key: genKey(),
					project: s.project,
				}))
				ensureTrailingEmpty()
				return
			}
		} catch (_) {}
	}

	planRows.value = [{ _key: genKey(), project: null }]
	ensureTrailingEmpty()
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
	showCreateProject.value = false
}

function onItemTypePick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) projectForm.value.itemType = i + 1
}

function onDifficultyPick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) projectForm.value.difficulty = i + 1
}

function mapCreatedToCatalogItem(created, fallbackName, duration) {
	let numId = null
	if (typeof created === 'number' || typeof created === 'string') {
		numId = Number(created)
	} else if (created && typeof created === 'object') {
		numId = extractPlanProjectItemId(created)
	}
	const name =
		created && typeof created === 'object'
			? (created.itemName ?? created.name) || fallbackName
			: fallbackName
	const dur =
		created && typeof created === 'object' && (created.duration ?? created.durationMin) != null
			? Number(created.duration ?? created.durationMin)
			: duration
	return {
		id: numId != null && Number.isFinite(numId) ? String(numId) : `new_${Date.now()}`,
		name: String(name || fallbackName || ''),
		durationMin: dur,
		hasMaterials: false,
	}
}

function onMaterialTypeNewPick(e) {
	const i = Number(e.detail.value)
	if (!Number.isNaN(i)) {
		projectForm.value.materialTypeNew = i + 1
		projectForm.value.materialTempPath = ''
	}
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

/** 从上传接口返回中解析图片/视频地址（字段名因后端而异） */
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

	/** 新建训练项目：创建接口不传 planId（留空 / 不提交该字段） */
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
		uni.showLoading({ title: '创建项目…' })
		createStage = 'createPlanProject'
		const createdId = await createPlanProject(payload)
		const itemId = extractPlanProjectItemId(createdId)
		if (!itemId) {
			console.error('[submitCreateProject]', createStage, {
				createdId,
				payload,
				hint: 'extractPlanProjectItemId 为空',
			})
			throw new Error('创建成功但未返回项目 id')
		}

		uni.showLoading({ title: '上传资料…' })
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
		if (!imageUrl && !videoUrl) {
			console.error('[submitCreateProject]', createStage, {
				uploadData,
				materialType: mt,
				hint: 'urlsFromUploadData 未得到 imageUrl/videoUrl',
			})
			throw new Error('上传未返回文件地址，无法登记资料')
		}

		uni.showLoading({ title: '登记资料…' })
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
		console.error('[submitCreateProject] failed', {
			stage: createStage,
			message: msg,
			err,
			payload,
			planId: hasPlanId ? pid : '(omitted)',
			materialType: mt,
			materialTempPath: projectForm.value.materialTempPath,
		})
		uni.showToast({ title: msg, icon: 'none', duration: 2800 })
	} finally {
		uni.hideLoading()
	}
}

async function onSave() {
	const slots = planRows.value.filter((r) => r.project).map((r) => ({ project: r.project }))
	try {
		uni.showLoading({ title: '保存中…' })
		if (planId.value) {
			await persistPlanInfo()
		}
		await saveTrainingPlanArrangement({
			planId: planId.value || undefined,
			slots,
		})
		await loadData()
		uni.hideLoading()
		uni.showToast({ title: '已保存', icon: 'success' })
		setTimeout(() => uni.navigateBack(), 600)
	} catch (e) {
		uni.hideLoading()
		uni.showToast({ title: (e && e.message) || '保存失败', icon: 'none' })
	}
}

onLoad(async (opt) => {
	planId.value = (opt && opt.planId) || ''
	const lid = opt && opt.lessonId != null && opt.lessonId !== '' ? parseInt(String(opt.lessonId), 10) : NaN
	lessonIdFromQuery.value = Number.isFinite(lid) && lid > 0 ? lid : 0
	const cid = opt && opt.courseId != null && opt.courseId !== '' ? parseInt(String(opt.courseId), 10) : NaN
	courseIdFromQuery.value = Number.isFinite(cid) && cid > 0 ? cid : 0
	const wantNew = opt.mode === 'new' || !planId.value
	isNew.value = wantNew
	uni.setNavigationBarTitle({
		title: wantNew ? '新建 · 训练计划安排' : '训练计划安排',
	})
	if (wantNew) {
		try {
			uni.showLoading({ title: '创建计划…' })
			const newId = await createTrainingPlanDraft({
				planTitle: '未命名训练计划',
			})
			if (newId == null || !Number.isFinite(Number(newId))) {
				throw new Error('创建计划失败')
			}
			planId.value = String(newId)
			isNew.value = false
			uni.setNavigationBarTitle({ title: '训练计划安排' })
		} catch (err) {
			const msg = err && err.message ? err.message : '创建失败'
			uni.showToast({ title: msg, icon: 'none', duration: 2800 })
			setTimeout(() => uni.navigateBack(), 800)
			return
		} finally {
			uni.hideLoading()
		}
	}
	await loadData()
})

/** 第 1 次 onShow 跳过（onLoad 已 loadData）；从编辑页等返回后刷新列表与计划区 */
let arrangePageShowCount = 0
onShow(async () => {
	if (!planId.value) return
	arrangePageShowCount += 1
	if (arrangePageShowCount === 1) return
	await loadData()
})
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #f0f4f8;
	display: flex;
	flex-direction: column;
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.plan-edit-card {
	margin: 16rpx 12rpx 0;
	padding: 16rpx 14rpx 14rpx;
	background: #fff;
	border-radius: 12rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	border: 1rpx solid #e6f4ff;
}

.plan-edit-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #1677ff;
	display: block;
	margin-bottom: 14rpx;
}

.plan-edit-row {
	margin-bottom: 14rpx;
}

.plan-edit-label {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 6rpx;
}

.plan-edit-input {
	width: 100%;
	box-sizing: border-box;
	min-height: 64rpx;
	padding: 12rpx 14rpx;
	font-size: 26rpx;
	background: #fafafa;
	border: 1rpx solid #e8e8e8;
	border-radius: 8rpx;
}

.plan-edit-textarea {
	width: 100%;
	box-sizing: border-box;
	min-height: 120rpx;
	padding: 12rpx 14rpx;
	font-size: 26rpx;
	background: #fafafa;
	border: 1rpx solid #e8e8e8;
	border-radius: 8rpx;
}

.plan-edit-picker {
	min-height: 64rpx;
	line-height: 64rpx;
	padding: 0 14rpx;
	font-size: 26rpx;
	background: #f0f9ff;
	border: 1rpx solid #91caff;
	border-radius: 8rpx;
	color: #333;
}

.plan-delete-plan-btn {
	margin-top: 8rpx;
	height: 72rpx;
	line-height: 72rpx;
	font-size: 26rpx;
	color: #ff4d4f;
	background: #fff2f0;
	border: 1rpx solid #ffccc7;
	border-radius: 8rpx;
}

.plan-delete-plan-btn::after {
	display: none;
}

.main {
	flex: 1;
	display: flex;
	flex-direction: row;
	padding: 16rpx 12rpx 0;
	gap: 12rpx;
	min-height: 0;
}

.col {
	display: flex;
	flex-direction: column;
	border-radius: 12rpx;
	background: #fff;
	padding: 12rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	min-height: 0;
}

.left {
	width: 42%;
	flex-shrink: 0;
}

.right {
	flex: 1;
	min-width: 0;
}

.col-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #1677ff;
	margin-bottom: 8rpx;
}

.side-note {
	margin-bottom: 8rpx;
}

.side-note-line {
	font-size: 20rpx;
	color: #52c41a;
	display: block;
	line-height: 1.3;
}

.side-note-line.sub {
	color: #389e0d;
	opacity: 0.9;
}

.side-note-line.only {
	margin-bottom: 6rpx;
}

.left-scroll {
	flex: 1;
	max-height: 62vh;
}

.lib-card {
	background: #f5faff;
	border: 2rpx solid #d6e4ff;
	border-radius: 16rpx;
	padding: 16rpx 14rpx;
	margin-bottom: 12rpx;
}

.lib-card.dragging {
	opacity: 0.65;
	border-color: #1677ff;
}

.lib-card.new {
	border-style: dashed;
	background: #fafafa;
}

.lib-name {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	display: block;
}

.lib-meta {
	font-size: 22rpx;
	color: #888;
	margin-top: 6rpx;
	display: block;
}

.lib-edit-wrap {
	margin-top: 10rpx;
	display: flex;
	justify-content: flex-end;
	gap: 12rpx;
}

.lib-edit-btn {
	font-size: 24rpx;
	color: #1677ff;
	padding: 6rpx 16rpx;
	border: 1rpx solid #91caff;
	border-radius: 8rpx;
	background: #f0f9ff;
}

.lib-delete-btn {
	font-size: 24rpx;
	color: #ff4d4f;
	padding: 6rpx 16rpx;
	border: 1rpx solid #ffccc7;
	border-radius: 8rpx;
	background: #fff2f0;
}

.lib-meta.sub {
	font-size: 20rpx;
}

.lib-hint {
	font-size: 20rpx;
	color: #999;
	line-height: 1.4;
	display: block;
	margin-top: 4rpx;
}

.new-block {
	margin-top: 8rpx;
	padding-top: 8rpx;
	border-top: 1rpx solid #f0f0f0;
}

.zone-hint {
	font-size: 20rpx;
	color: #52c41a;
	margin-bottom: 8rpx;
	display: block;
}

.plan-zone {
	flex: 1;
	border: 2rpx dashed #91caff;
	border-radius: 12rpx;
	padding: 12rpx;
	background: #f0f9ff;
	min-height: 400rpx;
}

.plan-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
	min-height: 72rpx;
	padding: 8rpx 10rpx;
	margin-bottom: 10rpx;
	background: #fff;
	border-radius: 10rpx;
	border: 1rpx solid #e6f4ff;
}

.plan-row.empty {
	border-style: dashed;
	background: rgba(255, 255, 255, 0.65);
}

.plan-row.ghost {
	opacity: 0.85;
}

.slot-num {
	width: 36rpx;
	height: 36rpx;
	line-height: 36rpx;
	text-align: center;
	font-size: 22rpx;
	color: #1677ff;
	font-weight: 600;
	background: #e6f4ff;
	border-radius: 8rpx;
	flex-shrink: 0;
}

.plan-chip {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8rpx 12rpx;
	background: #fafafa;
	border-radius: 8rpx;
	border: 1rpx solid #eee;
	min-width: 0;
}

.chip-text {
	font-size: 26rpx;
	color: #333;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.chip-dur {
	font-size: 22rpx;
	color: #666;
	flex-shrink: 0;
	margin-left: 8rpx;
}

.placeholder {
	flex: 1;
	font-size: 24rpx;
	color: #bbb;
	text-align: center;
}

.remove-x {
	width: 44rpx;
	text-align: center;
	font-size: 36rpx;
	color: #999;
	line-height: 1;
	flex-shrink: 0;
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
}

.save-btn {
	margin: 0;
	min-width: 200rpx;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 30rpx;
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	border: none;
	border-radius: 40rpx;
}

.save-btn::after {
	display: none;
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
	width: 100%;
	max-width: 640rpx;
	max-height: 85vh;
	background: #fff;
	border-radius: 20rpx;
	overflow: hidden;
	display: flex;
	flex-direction: column;
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

.modal-close {
	font-size: 44rpx;
	color: #999;
	line-height: 1;
	padding: 8rpx;
}

.modal-body {
	max-height: 56vh;
	padding: 24rpx;
	box-sizing: border-box;
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
</style>
