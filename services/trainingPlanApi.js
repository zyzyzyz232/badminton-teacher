/**
 * 训练计划 / 安排相关接口（admin-api）
 *
 * 约定：
 * - fetchTrainingPlanList → 优先 GET /teaching/plan/list-by-teacher（planTitle）；无数据时回退 plan-project 按 planId 聚合
 * - createTeachingPlan / createTrainingPlanDraft → POST /teaching/plan/create，data 为 Long（新 plan id）
 * - updateTeachingPlan → PUT /teaching/plan/update（含课堂绑定）
 * - saveTrainingPlanArrangement → 多次 PUT /teaching/plan-project/update 写 sortOrder
 * - createPlanProject → POST /teaching/plan-project/create（data 为 Long）；「新建训练项目」弹窗不传 planId，仅 teacherId + 业务字段
 * - associatePlanProject → POST /teaching/plan-project/associate-plan（id + planId，将项目关联到计划）
 * - disassociatePlanProject → DELETE /teaching/plan-project/delete?id=（项目 id，删除项目）
 * - deleteTeachingPlan → DELETE /teaching/plan/delete?id=（教学计划 id）
 */

/** 教学相关接口（admin-api 网关） */
const TEACHING_API_BASE = 'http://10.112.189.54:48080/admin-api'

/** 创建训练项目链路调试（控制台 + 真机调试器） */
function debugTrainingPlanApi(tag, detail) {
	try {
		const payload =
			typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2)
		console.error(`[trainingPlanApi:${tag}]`, payload)
	} catch {
		console.error(`[trainingPlanApi:${tag}]`, detail)
	}
}

function getToken() {
	return uni.getStorageSync('token') || ''
}

/** 与登录态一致：教师 userId === teacherId */
export function getTeacherIdFromStorage() {
	try {
		const u = uni.getStorageSync('userInfo')
		const id = u && (u.id != null ? u.id : u.userId)
		const n = typeof id === 'number' ? id : parseInt(String(id), 10)
		return Number.isFinite(n) && n > 0 ? n : 0
	} catch {
		return 0
	}
}

export function getTeacherNameFromStorage() {
	try {
		const u = uni.getStorageSync('userInfo')
		return (u && (u.nickname || u.username || u.name)) || ''
	} catch {
		return ''
	}
}

/**
 * POST/PUT 等 JSON 请求封装
 * @param {string} method
 * @param {string} path 如 /teaching/plan/update
 * @param {Record<string, unknown>|undefined} data
 */
function teachingJsonRequest(method, path, data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}${path}`,
			method,
			header: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: data || {},
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						resolve(d.data !== undefined ? d.data : null)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				resolve(d)
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/** create 接口返回的 data 仅为 Long（数字或可解析字符串） */
export function normalizeCreateLongId(data) {
	if (data == null) return null
	if (typeof data === 'number' && Number.isFinite(data)) return data
	if (typeof data === 'string') {
		const n = parseInt(data, 10)
		return Number.isFinite(n) ? n : null
	}
	return null
}

/**
 * GET /teaching/plan/list-by-teacher?teacherId=
 * @param {number|string} teacherId
 */
export function fetchPlanListByTeacher(teacherId) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan/list-by-teacher`,
			method: 'GET',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: { teacherId },
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						const raw = d.data
						const list = Array.isArray(raw)
							? raw
							: raw && Array.isArray(raw.list)
								? raw.list
								: []
						resolve(list)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				if (Array.isArray(d)) {
					resolve(d)
					return
				}
				resolve([])
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * GET /teaching/plan-project/list-by-teacher?teacherId=
 * @param {number|string} teacherId
 */
export function fetchPlanProjectsByTeacher(teacherId) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan-project/list-by-teacher`,
			method: 'GET',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: { teacherId },
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						const raw = d.data
						const list = Array.isArray(raw)
							? raw
							: raw && Array.isArray(raw.list)
								? raw.list
								: []
						resolve(list)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				if (Array.isArray(d)) {
					resolve(d)
					return
				}
				resolve([])
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * 编排页项目库：GET /teaching/plan-project/list-by-teacher
 * @param {number|string|undefined} [_planId] 保留参数兼容旧调用，不参与请求
 * @param {number|string} [teacherId] 默认从 storage
 */
export async function fetchTrainingProjectCatalogForArrange(_planId, teacherId) {
	const tid = teacherId != null && teacherId !== '' ? Number(teacherId) : getTeacherIdFromStorage()
	if (!Number.isFinite(tid) || tid <= 0) return []
	try {
		const rows = await fetchPlanProjectsByTeacher(tid)
		if (!Array.isArray(rows)) return []
		return rows.map((p) => ({
			id: p.id != null ? String(p.id) : `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
			name: (p.itemName != null ? p.itemName : p.name) || '',
			durationMin:
				p.duration != null
					? Number(p.duration)
					: p.durationMin != null
						? Number(p.durationMin)
						: undefined,
			hasMaterials: false,
			_planId: p.planId,
		}))
	} catch {
		return []
	}
}

/**
 * 回退：仅根据 plan-project/list-by-teacher 按 planId 聚合（行内常无 planTitle，易显示「训练计划 id」）
 * @param {number} teacherId
 * @returns {Promise<Array<{ id: string, title: string, subtitle?: string }>>}
 */
async function fetchTrainingPlanListFromProjectsAggregated(teacherId) {
	const list = await fetchPlanProjectsByTeacher(teacherId)
	if (!Array.isArray(list) || list.length === 0) return []

	/** @type {Map<string, { id: string, title: string, itemCount: number }>} */
	const byPlan = new Map()
	for (const row of list) {
		if (!row || typeof row !== 'object') continue
		const pid =
			row.planId ??
			row.teachingPlanId ??
			(row.plan && (row.plan.id ?? row.plan.planId)) ??
			null
		if (pid == null) continue
		const key = String(pid)
		const titleFromRow =
			(row.planTitle != null ? row.planTitle : null) ??
			(row.planName != null ? row.planName : null) ??
			(row.plan && (row.plan.planTitle ?? row.plan.title)) ??
			''
		if (!byPlan.has(key)) {
			byPlan.set(key, {
				id: key,
				title: String(titleFromRow || `训练计划 ${key}`),
				itemCount: 0,
			})
		}
		const entry = byPlan.get(key)
		entry.itemCount += 1
		if (titleFromRow && entry.title.startsWith('训练计划 ')) {
			entry.title = String(titleFromRow)
		}
	}
	return [...byPlan.values()].map(({ id, title, itemCount }) => ({
		id,
		title,
		subtitle: itemCount > 0 ? `${itemCount} 个训练项目` : undefined,
	}))
}

/**
 * 供训练计划列表页：优先拉教学计划列表（含 planTitle），与课堂「选择训练计划」数据源一致
 * @returns {Promise<Array<{ id: string, title: string, subtitle?: string }>>}
 */
export async function fetchTrainingPlanList() {
	const tid = getTeacherIdFromStorage()
	if (!tid) return []
	try {
		const plans = await fetchPlanListByTeacher(tid)
		const raw = Array.isArray(plans) ? plans : []
		if (raw.length > 0) {
			const mapped = raw
				.map((row) => {
					if (!row || typeof row !== 'object') return null
					const idVal = row.id != null ? row.id : row.planId
					if (idVal == null) return null
					const id = String(idVal)
					const title =
						(row.planTitle != null && String(row.planTitle).trim()) ||
						(row.title != null && String(row.title).trim()) ||
						(row.name != null && String(row.name).trim()) ||
						`训练计划 ${id}`
					const dur = row.duration != null ? Number(row.duration) : NaN
					const durSubtitle =
						Number.isFinite(dur) && dur > 0 ? `${Math.round(dur)} 分钟` : undefined
					return { id, title, durSubtitle }
				})
				.filter(Boolean)

			const countsByPlan = new Map()
			try {
				const proj = await fetchPlanProjectsByTeacher(tid)
				if (Array.isArray(proj)) {
					for (const row of proj) {
						if (!row || typeof row !== 'object') continue
						const pid =
							row.planId ??
							row.teachingPlanId ??
							(row.plan && (row.plan.id ?? row.plan.planId)) ??
							null
						if (pid == null) continue
						const key = String(pid)
						countsByPlan.set(key, (countsByPlan.get(key) || 0) + 1)
					}
				}
			} catch (_) {}

			return mapped.map((row) => {
				const n = countsByPlan.get(row.id) || 0
				const parts = []
				if (n > 0) parts.push(`${n} 个训练项目`)
				if (row.durSubtitle) parts.push(row.durSubtitle)
				return {
					id: row.id,
					title: row.title,
					subtitle: parts.length ? parts.join(' · ') : undefined,
				}
			})
		}
	} catch (_) {}

	try {
		return await fetchTrainingPlanListFromProjectsAggregated(tid)
	} catch {
		return []
	}
}

/**
 * POST /teaching/plan/create，成功返回 Long（新计划 id）
 * @param {Record<string, unknown>} body PlanSaveReqVO
 * @returns {Promise<number|null>}
 */
export async function createTeachingPlan(body) {
	const tid = getTeacherIdFromStorage()
	const payload = {
		planTitle: '未命名训练计划',
		planContent: '',
		planType: 1,
		difficulty: 1,
		duration: 60,
		status: 0,
		teacherId: tid,
		teacherName: getTeacherNameFromStorage(),
		...body,
	}
	if (!payload.teacherId) {
		throw new Error('缺少教师信息，请重新登录')
	}
	// 教师独立建计划：不传无效课堂/课程 id，避免后端将 0/null 判为「课堂编号不能为空」
	;['lessonId', 'courseId'].forEach((k) => {
		const v = payload[k]
		if (v === undefined || v === null || v === '' || (typeof v === 'number' && v <= 0)) {
			delete payload[k]
			return
		}
		const n = Number(v)
		if (!Number.isFinite(n) || n <= 0) delete payload[k]
	})
	const data = await teachingJsonRequest('POST', '/teaching/plan/create', payload)
	return normalizeCreateLongId(data)
}

/**
 * @param {Record<string, unknown>} [extra] 覆盖默认字段
 * @returns {Promise<number|null>} 新 plan id
 */
export async function createTrainingPlanDraft(extra) {
	return createTeachingPlan(extra && typeof extra === 'object' ? extra : {})
}

/**
 * PUT /teaching/plan/update
 * @param {Record<string, unknown>} body PlanSaveReqVO（须含 id）
 */
export function updateTeachingPlan(body) {
	return teachingJsonRequest('PUT', '/teaching/plan/update', body)
}

/**
 * DELETE /teaching/plan/delete?id=
 * @param {number|string} id 教学计划 id
 */
export function deleteTeachingPlan(id) {
	const planId = typeof id === 'number' ? id : parseInt(String(id), 10)
	if (!Number.isFinite(planId) || planId <= 0) {
		return Promise.reject(new Error('教学计划 id 无效'))
	}
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan/delete?id=${planId}`,
			method: 'DELETE',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						resolve(d.data !== undefined ? d.data : null)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				resolve(d)
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * 在课堂中选择计划后：拉取计划详情并 PUT update，写入 lessonId / courseId 以绑定当前课堂
 * @param {{ planId: number|string, lessonId: number|string, courseId?: number|string }} opts
 */
export async function bindPlanToCurrentLesson(opts) {
	const planId = opts.planId
	const lessonId = opts.lessonId
	const courseId = opts.courseId
	const detail = await fetchTrainingPlanDetail(planId)
	if (!detail || detail.id == null) {
		throw new Error('无法加载计划详情')
	}
	const tid = getTeacherIdFromStorage()
	const lid = lessonId != null ? Number(lessonId) : NaN
	if (!Number.isFinite(lid) || lid <= 0) {
		throw new Error('课堂编号无效')
	}
	const body = {
		id: Number(detail.id),
		planTitle: detail.planTitle,
		planContent: detail.planContent != null ? String(detail.planContent) : '',
		startTime: detail.startTime,
		endTime: detail.endTime,
		duration: detail.duration != null ? Number(detail.duration) : 60,
		planType: detail.planType != null ? Number(detail.planType) : 1,
		difficulty: detail.difficulty != null ? Number(detail.difficulty) : 1,
		status: detail.status != null ? Number(detail.status) : 0,
		teacherId: detail.teacherId != null ? Number(detail.teacherId) : tid,
		teacherName: detail.teacherName || getTeacherNameFromStorage(),
		lessonId: lid,
	}
	const cid = courseId != null && courseId !== '' ? Number(courseId) : NaN
	if (Number.isFinite(cid) && cid > 0) {
		body.courseId = cid
	}
	Object.keys(body).forEach((k) => {
		if (body[k] === undefined || body[k] === '') delete body[k]
	})
	await updateTeachingPlan(body)
}

/**
 * 保存计划区顺序：对每条有服务端 id 的项目多次 PUT /teaching/plan-project/update。
 * 项目关联在「从项目库添加」时已通过 associate-plan 完成，此处不再重复关联。
 * @param {{ planId: number|string, slots: Array<{ project: { id: string, name: string, durationMin?: number } }> }} payload
 */
export async function saveTrainingPlanArrangement(payload) {
	const planIdNum = parseInt(String(payload.planId), 10)
	if (!planIdNum) {
		throw new Error('planId 无效')
	}
	const teacherId = getTeacherIdFromStorage()
	if (!teacherId) {
		throw new Error('缺少教师信息')
	}
	let existingList = []
	try {
		existingList = await fetchPlanProjectsByPlan(planIdNum)
	} catch {
		existingList = []
	}
	const byId = new Map()
	for (const p of Array.isArray(existingList) ? existingList : []) {
		const pid = p.id != null ? Number(p.id) : NaN
		if (Number.isFinite(pid)) byId.set(pid, p)
	}
	const slots = Array.isArray(payload.slots) ? payload.slots : []
	let order = 0
	for (let i = 0; i < slots.length; i++) {
		const proj = slots[i] && slots[i].project
		if (!proj || proj.id == null || proj.id === '') continue
		if (String(proj.id).startsWith('demo-') || String(proj.id).startsWith('tmp_') || String(proj.id).startsWith('new_')) {
			continue
		}
		const id = parseInt(String(proj.id), 10)
		if (!Number.isFinite(id)) continue
		order += 1
		const full = byId.get(id) || {}
		const duration =
			proj.durationMin != null
				? Number(proj.durationMin)
				: full.duration != null
					? Number(full.duration)
					: 20
		const row = {
			id,
			planId: planIdNum,
			teacherId,
			itemName: ((proj.name || '').trim() || full.itemName || '训练项').trim(),
			itemContent: full.itemContent != null ? String(full.itemContent) : undefined,
			itemType: full.itemType != null ? Number(full.itemType) : 1,
			difficulty: full.difficulty != null ? Number(full.difficulty) : 1,
			duration: Number.isFinite(duration) ? duration : 20,
			score: full.score != null ? Number(full.score) : 100,
			sortOrder: order,
		}
		Object.keys(row).forEach((k) => {
			if (row[k] === undefined) delete row[k]
		})
		await teachingJsonRequest('PUT', '/teaching/plan-project/update', row)
	}
	return { ok: true }
}

/**
 * PUT /teaching/plan-project/update
 * @param {Record<string, unknown>} body
 */
export function updatePlanProject(body) {
	return teachingJsonRequest('PUT', '/teaching/plan-project/update', body)
}

/**
 * DELETE /teaching/plan-project/delete?id=
 * @param {number|string} id 项目 id
 */
export function deletePlanProject(id) {
	const itemId = typeof id === 'number' ? id : parseInt(String(id), 10)
	if (!Number.isFinite(itemId) || itemId <= 0) {
		return Promise.reject(new Error('项目 id 无效'))
	}
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan-project/delete?id=${itemId}`,
			method: 'DELETE',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						resolve(d.data !== undefined ? d.data : null)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				resolve(d)
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * GET /teaching/plan/list-by-lesson?lessonId=
 * @param {number|string} lessonId
 * @returns {Promise<unknown[]>}
 */
export function fetchPlanListByLesson(lessonId) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan/list-by-lesson`,
			method: 'GET',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: { lessonId },
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						const raw = d.data
						const list = Array.isArray(raw)
							? raw
							: raw && Array.isArray(raw.list)
								? raw.list
								: []
						resolve(list)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				if (Array.isArray(d)) {
					resolve(d)
					return
				}
				resolve([])
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * GET /teaching/plan-project/get?id=
 * @param {number|string} id 训练项目 id
 * @returns {Promise<Record<string, unknown> | null>}
 */
export function fetchPlanProjectById(id) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan-project/get`,
			method: 'GET',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: { id },
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						resolve(d.data != null ? d.data : null)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				resolve(typeof d === 'object' ? d : null)
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * GET /teaching/plan-project/list-by-plan?planId=
 * @param {number|string} planId
 * @returns {Promise<unknown[]>}
 */
export function fetchPlanProjectsByPlan(planId) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan-project/list-by-plan`,
			method: 'GET',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: { planId },
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						const raw = d.data
						const list = Array.isArray(raw)
							? raw
							: raw && Array.isArray(raw.list)
								? raw.list
								: []
						resolve(list)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				if (Array.isArray(d)) {
					resolve(d)
					return
				}
				resolve([])
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * 将训练项目关联到计划
 * POST /teaching/plan-project/associate-plan
 * @param {number|string} itemId 项目 id
 * @param {number|string} planId 计划 id
 */
export function associatePlanProject(itemId, planId) {
	const id = typeof itemId === 'number' ? itemId : parseInt(String(itemId), 10)
	const pid = typeof planId === 'number' ? planId : parseInt(String(planId), 10)
	if (!Number.isFinite(id) || id <= 0) {
		return Promise.reject(new Error('项目 id 无效'))
	}
	if (!Number.isFinite(pid) || pid <= 0) {
		return Promise.reject(new Error('planId 无效'))
	}
	return teachingJsonRequest('POST', '/teaching/plan-project/associate-plan', {
		id,
		planId: pid,
	})
}

/**
 * 删除训练项目
 * DELETE /teaching/plan-project/delete?id=
 * @param {number|string} itemId 项目 id
 */
export function disassociatePlanProject(itemId) {
	const id = typeof itemId === 'number' ? itemId : parseInt(String(itemId), 10)
	if (!Number.isFinite(id) || id <= 0) {
		return Promise.reject(new Error('项目 id 无效'))
	}
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan-project/delete?id=${id}`,
			method: 'DELETE',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						resolve(d.data !== undefined ? d.data : null)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				resolve(d)
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * 创建项目并关联到计划（创建不传 planId，再 associate）
 * @param {number|string} planId
 * @param {string} itemName
 */
export async function createPlanProjectMinimal(planId, itemName) {
	const tid = getTeacherIdFromStorage()
	const itemId = await createPlanProject({
		itemName: String(itemName || '').trim(),
		teacherId: tid,
	})
	await associatePlanProject(itemId, planId)
	return itemId
}

/**
 * POST /teaching/plan-project/create，成功 data 为 Long
 * @param {Record<string, unknown>} body
 * @returns {Promise<number>} 新项目 id
 */
export function createPlanProject(body) {
	const tid = getTeacherIdFromStorage()
	const payload = { ...body, teacherId: body.teacherId != null ? body.teacherId : tid }
	Object.keys(payload).forEach((k) => {
		if (payload[k] === undefined || payload[k] === '') delete payload[k]
	})
	if (!payload.teacherId) {
		return Promise.reject(new Error('缺少教师信息'))
	}
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan-project/create`,
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: payload,
			success: (res) => {
				const d = res.data
				if (d == null) {
					debugTrainingPlanApi('createPlanProject', {
						httpStatus: res.statusCode,
						body: null,
						sentPayload: payload,
					})
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						const id = normalizeCreateLongId(d.data !== undefined ? d.data : null)
						if (id == null) {
							debugTrainingPlanApi('createPlanProject', {
								httpStatus: res.statusCode,
								body: d,
								sentPayload: payload,
								hint: 'code=0 但 data 无法解析为项目 id',
							})
							reject(new Error('创建成功但未返回项目 id'))
							return
						}
						resolve(id)
					} else {
						debugTrainingPlanApi('createPlanProject', {
							httpStatus: res.statusCode,
							body: d,
							sentPayload: payload,
						})
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				debugTrainingPlanApi('createPlanProject', {
					httpStatus: res.statusCode,
					body: d,
					sentPayload: payload,
					hint: '无数字 code 字段，响应格式异常',
				})
				reject(new Error('响应格式异常'))
			},
			fail: (err) => {
				debugTrainingPlanApi('createPlanProject:network', { err, sentPayload: payload })
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * GET /teaching/plan/get?id= （query 参数 id 为 planId）
 * @param {number|string} planId
 * @returns {Promise<Record<string, unknown> | null>}
 */
export function fetchTrainingPlanDetail(planId) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan/get`,
			method: 'GET',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: { id: planId },
			success: (res) => {
				const d = res.data
				if (d == null) {
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						resolve(d.data != null ? d.data : null)
					} else {
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				resolve(typeof d === 'object' ? d : null)
			},
			fail: (err) => {
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * 当前计划下的项目（仅 list-by-plan，兼容旧调用）
 * @param {number|string|undefined} planId
 */
export async function fetchTrainingProjectCatalog(planId) {
	if (planId == null || planId === '') return []
	try {
		const list = await fetchPlanProjectsByPlan(planId)
		if (!Array.isArray(list)) return []
		return list.map((p) => ({
			id: p.id != null ? String(p.id) : `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
			name: (p.itemName != null ? p.itemName : p.name) || '',
			durationMin: p.duration != null ? Number(p.duration) : undefined,
			hasMaterials: false,
		}))
	} catch {
		return []
	}
}

/**
 * 从创建训练项目接口返回中解析 itemId（create 仅返回 Long 时直接传 number）
 * @param {Record<string, unknown>|number|string|null|undefined} created
 */
export function extractPlanProjectItemId(created) {
	if (created == null) return null
	if (typeof created === 'number' || typeof created === 'string') {
		const n = Number(created)
		return Number.isFinite(n) ? n : null
	}
	const id = created.id ?? created.itemId
	if (id == null) return null
	const n = Number(id)
	return Number.isFinite(n) ? n : null
}

/**
 * POST /teaching/plan-material/create
 * @param {Record<string, unknown>} body
 */
export function createPlanMaterial(body) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}/teaching/plan-material/create`,
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			data: body,
			success: (res) => {
				const d = res.data
				if (d == null) {
					debugTrainingPlanApi('createPlanMaterial', {
						httpStatus: res.statusCode,
						body: null,
						sentBody: body,
					})
					reject(new Error('空响应'))
					return
				}
				if (typeof d.code === 'number') {
					if (d.code === 0) {
						resolve(d.data !== undefined ? d.data : d)
					} else {
						debugTrainingPlanApi('createPlanMaterial', {
							httpStatus: res.statusCode,
							body: d,
							sentBody: body,
						})
						reject(new Error(d.msg || `请求失败(${d.code})`))
					}
					return
				}
				debugTrainingPlanApi('createPlanMaterial', {
					httpStatus: res.statusCode,
					body: d,
					sentBody: body,
					hint: '无数字 code，按原样 resolve',
				})
				resolve(d)
			},
			fail: (err) => {
				debugTrainingPlanApi('createPlanMaterial:network', { err, sentBody: body })
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}

/**
 * 上传项目资料文件（拿到 URL 后再调 createPlanMaterial）
 * @param {{ filePath: string, planId?: number|string, itemId: number|string, materialType: number, title?: string, description?: string }} opts
 */
export function uploadPlanMaterialFile(opts) {
	const { filePath, planId, itemId, materialType, title = '', description = '' } = opts
	const formData = {
		itemId: String(itemId),
		materialType: String(materialType),
		title: title || '',
		description: description || '',
	}
	if (planId != null && planId !== '') {
		const pn = Number(planId)
		if (Number.isFinite(pn) && pn > 0) {
			formData.planId = String(planId)
		}
	}
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: `${TEACHING_API_BASE}/teaching/plan-material/upload`,
			filePath,
			name: 'file',
			header: {
				Authorization: `Bearer ${getToken()}`,
				'Tenant-Id': '1',
			},
			formData,
			success: (res) => {
				try {
					const raw = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
					if (raw && typeof raw.code === 'number') {
						if (raw.code === 0) {
							resolve(raw.data)
							return
						}
						debugTrainingPlanApi('uploadPlanMaterialFile', {
							httpStatus: res.statusCode,
							body: raw,
							formData,
						})
						reject(new Error(raw.msg || '上传失败'))
						return
					}
					debugTrainingPlanApi('uploadPlanMaterialFile', {
						httpStatus: res.statusCode,
						body: raw,
						hint: '无 code 字段，按原样 resolve',
					})
					resolve(raw)
				} catch (e) {
					debugTrainingPlanApi('uploadPlanMaterialFile:parse', {
						httpStatus: res.statusCode,
						rawDataPreview:
							typeof res.data === 'string'
								? res.data.slice(0, 800)
								: res.data,
						parseError: String(e),
					})
					reject(e instanceof Error ? e : new Error('解析上传结果失败'))
				}
			},
			fail: (err) => {
				debugTrainingPlanApi('uploadPlanMaterialFile:network', {
					err,
					formData,
				})
				const msg =
					(err && (err.errMsg || err.message)) ||
					(typeof err === 'string' ? err : '网络错误')
				reject(new Error(msg))
			},
		})
	})
}
