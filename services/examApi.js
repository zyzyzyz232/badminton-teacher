/**
 * 考试模式 API（admin-api）
 *
 * 考试 CRUD / 成绩闭环打本地旁路 48081；登录/课程/课堂/名册走现网 48080。
 * 考核资料文件优先现网 pic-video；成绩视频只走旁路本地盘。
 * 本机 IP 若变化，只改 TEACHING_API_BASE。
 */

import { ensureTeacherSession } from './userProfile.js'

const LIVE_API_BASE = 'http://10.112.149.184:48080/admin-api'
const TEACHING_API_BASE = 'http://10.29.108.157:48081/admin-api'

function getToken() {
	return uni.getStorageSync('token') || ''
}

function authHeaders(json = false) {
	const h = {
		Authorization: `Bearer ${getToken()}`,
		'Tenant-Id': '1',
	}
	if (json) h['Content-Type'] = 'application/json'
	return h
}

/**
 * 统一解析业务错误（含占比超限等）
 * @param {{ code?: number, msg?: string, data?: unknown }} d
 */
export function formatExamApiError(d) {
	if (!d || typeof d !== 'object') return '请求失败'
	const msg = d.msg || `请求失败(${d.code})`
	const lower = String(msg).toLowerCase()
	if (
		d.code === 'exam_ratio_exceeded' ||
		lower.includes('exam_ratio_exceeded') ||
		(typeof msg === 'string' && msg.includes('剩余'))
	) {
		return msg
	}
	return msg
}

function teachingJsonRequest(method, path, data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}${path}`,
			method,
			header: authHeaders(true),
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
						reject(new Error(formatExamApiError(d)))
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

function teachingGet(path, query, apiBase = TEACHING_API_BASE) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${apiBase}${path}`,
			method: 'GET',
			header: authHeaders(),
			data: query || {},
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
						reject(new Error(formatExamApiError(d)))
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

function teachingDelete(pathWithQuery) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: `${TEACHING_API_BASE}${pathWithQuery}`,
			method: 'DELETE',
			header: authHeaders(),
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
						reject(new Error(formatExamApiError(d)))
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

/** create 接口 data 为 Long 时归一化 */
export function normalizeCreateLongId(data) {
	if (data == null) return null
	if (typeof data === 'number' && Number.isFinite(data)) return data
	if (typeof data === 'string') {
		const n = parseInt(data, 10)
		return Number.isFinite(n) ? n : null
	}
	if (typeof data === 'object') {
		const id = data.id ?? data.examId ?? data.itemId
		if (id == null) return null
		const n = Number(id)
		return Number.isFinite(n) ? n : null
	}
	return null
}

export function resolveExamId(row) {
	if (!row) return 0
	const v = row.id ?? row.examId
	const n = typeof v === 'number' ? v : parseInt(String(v), 10)
	return Number.isFinite(n) ? n : 0
}

/** 课堂行用 id；考试行必须优先 lessonId，否则会误用考试 id */
export function resolveLessonId(row) {
	if (!row) return 0
	const v = row.lessonId ?? row.lesson_id ?? row.id
	const n = typeof v === 'number' ? v : parseInt(String(v), 10)
	return Number.isFinite(n) ? n : 0
}

export function resolveExamItemId(row) {
	if (!row) return 0
	const v = row.id ?? row.itemId ?? row.examItemId
	const n = typeof v === 'number' ? v : parseInt(String(v), 10)
	return Number.isFinite(n) ? n : 0
}

/**
 * 计算同课程已用 / 剩余占比
 * @param {Array<{ scoreRatio?: number, id?: number, examId?: number }>} examList
 * @param {number} [excludeExamId] 编辑时排除自身
 */
export function calcScoreRatioUsage(examList, excludeExamId = 0) {
	const list = Array.isArray(examList) ? examList : []
	let used = 0
	for (const row of list) {
		const id = resolveExamId(row)
		if (excludeExamId && id === excludeExamId) continue
		const r = Number(row.scoreRatio ?? row.score_ratio ?? 0)
		if (Number.isFinite(r) && r > 0) used += r
	}
	if (used < 0) used = 0
	if (used > 100) used = 100
	return { used, remaining: Math.max(0, 100 - used) }
}

export function calcItemWeightSum(items, excludeItemId = 0) {
	const list = Array.isArray(items) ? items : []
	let sum = 0
	for (const row of list) {
		const id = resolveExamItemId(row)
		if (excludeItemId && id === excludeItemId) continue
		const w = Number(row.weight ?? 0)
		if (Number.isFinite(w) && w > 0) sum += w
	}
	return sum
}

// ---------- Exam head ----------

/** GET /teaching/exam/list-by-course?courseId= */
export function fetchExamListByCourse(courseId) {
	return teachingGet('/teaching/exam/list-by-course', { courseId })
}

/** GET /teaching/exam/get?id= */
export function fetchExamGet(id) {
	return teachingGet('/teaching/exam/get', { id })
}

/**
 * POST /teaching/exam/create
 * @param {{ courseId: number, lessonId: number, title: string, scoreRatio: number }} body
 */
export function createExam(body) {
	return teachingJsonRequest('POST', '/teaching/exam/create', body)
}

/**
 * PUT /teaching/exam/update
 * @param {{ id: number, courseId?: number, lessonId?: number, title?: string, scoreRatio?: number, status?: number }} body
 */
export function updateExam(body) {
	return teachingJsonRequest('PUT', '/teaching/exam/update', body)
}

/** DELETE /teaching/exam/delete?id= */
export function deleteExam(id) {
	return teachingDelete(`/teaching/exam/delete?id=${id}`)
}

// ---------- Exam items ----------

/** GET /teaching/exam-item/list-by-exam?examId= */
export function fetchExamItemListByExam(examId) {
	return teachingGet('/teaching/exam-item/list-by-exam', { examId })
}

/** GET /teaching/exam-item/get?id= */
export function fetchExamItemGet(id) {
	return teachingGet('/teaching/exam-item/get', { id })
}

/**
 * POST /teaching/exam-item/create
 * @param {{ examId: number, itemName: string, maxScore: number, weight: number, algoType: number, sortOrder?: number }} body
 */
export function createExamItem(body) {
	return teachingJsonRequest('POST', '/teaching/exam-item/create', body)
}

/**
 * PUT /teaching/exam-item/update
 */
export function updateExamItem(body) {
	return teachingJsonRequest('PUT', '/teaching/exam-item/update', body)
}

/** DELETE /teaching/exam-item/delete?id= */
export function deleteExamItem(id) {
	return teachingDelete(`/teaching/exam-item/delete?id=${id}`)
}

// ---------- Exam item materials ----------

/** GET /teaching/exam-item-material/list-by-item?examItemId= */
export function fetchExamItemMaterialList(examItemId) {
	return teachingGet('/teaching/exam-item-material/list-by-item', {
		examItemId,
	})
}

/**
 * POST /teaching/exam-item-material/create
 * @param {Record<string, unknown>} body
 */
export function createExamItemMaterial(body) {
	return teachingJsonRequest('POST', '/teaching/exam-item-material/create', body)
}

export function updateExamItemMaterial(body) {
	return teachingJsonRequest('PUT', '/teaching/exam-item-material/update', body)
}

export function deleteExamItemMaterial(id) {
	return teachingDelete(`/teaching/exam-item-material/delete?id=${id}`)
}

function asList(data) {
	if (Array.isArray(data)) return data
	if (data && Array.isArray(data.list)) return data.list
	return []
}

function toMaterialUrls(row, materialType) {
	const type = Number(materialType) || 1
	if (typeof row === 'string' && row) {
		return {
			url: row,
			imageUrl: type === 1 ? row : '',
			videoUrl: type === 2 ? row : '',
		}
	}
	if (!row || typeof row !== 'object') return null
	const url =
		row.url ||
		row.fileUrl ||
		(type === 2 ? row.videoUrl : row.imageUrl) ||
		''
	if (!url && !row.imageUrl && !row.videoUrl) return null
	return {
		url,
		imageUrl: row.imageUrl || (type === 1 ? url : ''),
		videoUrl: row.videoUrl || (type === 2 ? url : ''),
		duration: row.duration,
		title: row.title,
		description: row.description,
		sort: row.sort ?? row.sortOrder,
	}
}

function parseUploadResponse(res) {
	const status = Number(res && res.statusCode)
	const body = res && res.data
	if (status && (status < 200 || status >= 300)) {
		throw new Error(`上传失败(${status})`)
	}
	let raw = body
	if (typeof body === 'string') {
		const text = body.trim()
		if (!text) {
			throw new Error('上传返回空响应')
		}
		try {
			raw = JSON.parse(text)
		} catch (e) {
			throw new Error(text.slice(0, 80) || '解析上传结果失败')
		}
	}
	if (raw && typeof raw.code === 'number' && raw.code !== 0) {
		throw new Error(formatExamApiError(raw))
	}
	return raw && raw.data !== undefined ? raw.data : raw
}

function uploadFailMessage(err) {
	if (!err) return '网络错误'
	if (typeof err === 'string') return err
	const msg = err.errMsg || err.message || err.msg || ''
	if (msg) return msg
	try {
		const text = JSON.stringify(err)
		return text && text !== '{}' ? text : '网络错误'
	} catch {
		return '网络错误'
	}
}

function uniUploadFile(url, filePath, formData) {
	return new Promise((resolve, reject) => {
		const header = {
			Authorization: `Bearer ${getToken()}`,
			'Tenant-Id': '1',
		}
		uni.uploadFile({
			url,
			filePath,
			name: 'file',
			timeout: 180000,
			header,
			formData,
			success: (res) => {
				try {
					resolve(parseUploadResponse(res))
				} catch (e) {
					reject(e instanceof Error ? e : new Error('解析上传结果失败'))
				}
			},
			fail: (err) => {
				reject(new Error(uploadFailMessage(err)))
			},
		})
	})
}

/**
 * 教学模式同一条现网链路：文件落到 48080/pic-video，再回读 URL。
 */
async function uploadExamFileViaLiveTeaching(opts) {
	const { filePath, examItemId, materialType, title = '', description = '' } = opts
	const type = Number(materialType) || 1
	const formData = {
		itemId: String(examItemId),
		materialType: String(type),
		title: title || '',
		description: description || '',
	}
	const data = await uniUploadFile(
		`${LIVE_API_BASE}/teaching/plan-material/upload`,
		filePath,
		formData
	)
	let row = data
	if (typeof row === 'number' || (typeof row === 'string' && /^\d+$/.test(row))) {
		try {
			row = await teachingGet(
				'/teaching/plan-material/get',
				{ id: row },
				LIVE_API_BASE
			)
		} catch (e) {
			row = null
		}
	}
	let parsed = toMaterialUrls(row, type)
	if (!parsed) {
		const list = asList(
			await teachingGet(
				'/teaching/plan-material/list-by-item',
				{ itemId: examItemId },
				LIVE_API_BASE
			)
		)
		const newest = list
			.slice()
			.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0]
		parsed = toMaterialUrls(newest, type)
	}
	if (!parsed) {
		throw new Error('上传成功但未返回文件地址')
	}
	return parsed
}

/**
 * 旁路本地落盘：POST /teaching/exam-item-material/upload
 */
async function uploadExamFileViaSidecar(opts) {
	const { filePath, materialType } = opts
	const type = Number(materialType) || 1
	const data = await uniUploadFile(
		`${TEACHING_API_BASE}/teaching/exam-item-material/upload`,
		filePath,
		{ materialType: String(type) }
	)
	const parsed = toMaterialUrls(data, type)
	if (!parsed) {
		throw new Error('上传成功但未返回文件地址')
	}
	return parsed
}

/**
 * 优先走现网 pic-video（与教学一致）；失败则旁路本地落盘。
 * @param {{ filePath: string, examItemId: number|string, materialType: number, title?: string, description?: string }} opts
 */
export async function uploadExamItemMaterialFile(opts) {
	try {
		return await uploadExamFileViaLiveTeaching(opts)
	} catch (liveErr) {
		try {
			return await uploadExamFileViaSidecar(opts)
		} catch (sidecarErr) {
			const liveMsg = liveErr instanceof Error ? liveErr.message : String(liveErr)
			const sideMsg =
				sidecarErr instanceof Error ? sidecarErr.message : String(sidecarErr)
			throw new Error(sideMsg && sideMsg !== liveMsg ? sideMsg : liveMsg)
		}
	}
}

/**
 * 上传并写入考核项资料元数据（不写计划资料业务语义；若 upload 副作用写了 plan-material，需后端调整）
 */
export async function uploadAndCreateExamItemMaterial(opts) {
	const uploaded = await uploadExamItemMaterialFile(opts)
	const materialType = Number(opts.materialType) || 1
	const imageUrl =
		uploaded.imageUrl ||
		(materialType === 1 ? uploaded.url || uploaded.fileUrl || '' : '') ||
		''
	const videoUrl =
		uploaded.videoUrl ||
		(materialType === 2 ? uploaded.url || uploaded.fileUrl || '' : '') ||
		''
	const body = {
		examItemId: Number(opts.examItemId),
		materialType,
		imageUrl: imageUrl || uploaded.imageUrl || '',
		videoUrl: videoUrl || uploaded.videoUrl || '',
		duration: uploaded.duration != null ? uploaded.duration : undefined,
		title: opts.title || uploaded.title || '',
		description: opts.description || uploaded.description || '',
		sort: uploaded.sort ?? uploaded.sortOrder ?? 0,
	}
	const created = await createExamItemMaterial(body)
	return { uploaded, created, materialId: normalizeCreateLongId(created) }
}

// ---------- Lessons (existing endpoints) ----------

/**
 * 课堂列表：现网为 GET /teaching/course/list-lessons
 * 设计文档写的 list-by-course 若后端另开，可在此切换。
 * @param {number|string} courseId
 * @param {{ type?: number }} [opts] type=2 时前端过滤考试课堂
 */
export async function fetchLessonsByCourse(courseId, opts = {}) {
	const data = await teachingGet(
		'/teaching/course/list-lessons',
		{ courseId },
		LIVE_API_BASE
	)
	const list = Array.isArray(data) ? data : []
	const typeFilter = opts.type
	if (typeFilter == null) return list
	return list.filter((row) => {
		const t = Number(row.type ?? row.lessonType)
		if (t === Number(typeFilter)) return true
		// 考试课堂：兼容旧数据 type=11（picker 字符串拼接）以及 typeText
		if (Number(typeFilter) === 2) {
			if (t === 11) return true
			return String(row.typeText || '').includes('考试')
		}
		return false
	})
}

/**
 * 开考前配置完整性校验
 * @param {number|string} examId
 * @returns {Promise<{ ok: boolean, reason?: string, items?: unknown[], materialCounts?: Record<number, number> }>}
 */
export async function validateExamReadyForRoom(examId) {
	const itemsRaw = await fetchExamItemListByExam(examId)
	const items = Array.isArray(itemsRaw) ? itemsRaw : []
	if (items.length < 1) {
		return { ok: false, reason: '请至少配置 1 个考核项', items }
	}
	const weightSum = calcItemWeightSum(items)
	if (weightSum !== 100) {
		return {
			ok: false,
			reason: `考核项权重之和应为 100%（当前 ${weightSum}%）`,
			items,
		}
	}
	return { ok: true, items }
}

export async function fetchClassStudents(classId) {
	const data = await teachingGet(
		'/teaching/class-student/list-by-class',
		{ classId },
		LIVE_API_BASE
	)
	return Array.isArray(data) ? data : asList(data)
}

function pickExamItemMaterial(materials) {
	const list = asList(materials)
		.slice()
		.sort((a, b) => Number(a.sort ?? a.sortOrder ?? 0) - Number(b.sort ?? b.sortOrder ?? 0))
	const video = list.find((m) => {
		const type = Number(m.materialType)
		const url = m.videoUrl || (type === 2 ? m.url || m.fileUrl : '')
		return typeof url === 'string' && url
	})
	const image = list.find((m) => {
		const type = Number(m.materialType)
		const url = m.imageUrl || (type === 1 ? m.url || m.fileUrl : '')
		return typeof url === 'string' && url
	})
	return { video, image, first: video || image || list[0] || null }
}

/**
 * 组装 setExamBriefing 的 items：每项取第一条视频，否则第一条图片。
 * @param {number|string} examId
 */
export async function buildExamBriefingItems(examId) {
	const itemsRaw = await fetchExamItemListByExam(examId)
	const items = Array.isArray(itemsRaw) ? itemsRaw : asList(itemsRaw)
	const sorted = items.slice().sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
	return Promise.all(
		sorted.map(async (row) => {
			const idNum = resolveExamItemId(row)
			const id = idNum ? String(idNum) : ''
			let materials = []
			if (idNum) {
				try {
					materials = await fetchExamItemMaterialList(idNum)
				} catch {
					materials = []
				}
			}
			const picked = pickExamItemMaterial(materials)
			const videoUrl =
				(picked.video && (picked.video.videoUrl || picked.video.url || picked.video.fileUrl)) || ''
			const imageUrl =
				(picked.image && (picked.image.imageUrl || picked.image.url || picked.image.fileUrl)) || ''
			const descSource = picked.video || picked.image || picked.first || {}
			const instruction =
				typeof descSource.description === 'string' && descSource.description.trim()
					? descSource.description.trim()
					: ''
			const view = {
				id,
				title: row.itemName || `考核项${id}`,
			}
			const maxScore = Number(row.maxScore)
			if (Number.isFinite(maxScore)) view.maxScore = maxScore
			const weight = Number(row.weight)
			if (Number.isFinite(weight)) view.weight = weight
			const algoType = Number(row.algoType)
			if (Number.isFinite(algoType)) view.algoType = algoType
			if (videoUrl) view.videoUrl = videoUrl
			if (imageUrl) view.imageUrl = imageUrl
			if (instruction) view.instruction = instruction
			return view
		})
	)
}

export function mapClassStudentToExaminee(row) {
	if (!row || typeof row !== 'object') return null
	const classStudentId = String(row.id ?? row.classStudentId ?? '').trim()
	if (!classStudentId) return null
	const item = {
		classStudentId,
		name: row.studentName || row.name || '未命名',
		status: 'waiting',
	}
	if (row.userId != null && row.userId !== '') item.userId = String(row.userId)
	if (row.studentNo) item.studentNo = String(row.studentNo)
	return item
}

export const EXAM_RESULTS_STORAGE_KEYS = {
	courseId: 'examResultsCourseId',
	examId: 'examResultsExamId',
	classId: 'examResultsClassId',
}

export function examScoreStatusText(status) {
	const map = {
		0: '未考',
		1: '计算中',
		2: '待审核',
		3: '已完成',
		4: '失败',
		5: '缺考',
	}
	return map[Number(status)] || '未考'
}

export async function fetchTeacherCourses() {
	const { teacherId } = await ensureTeacherSession()
	const data = await teachingGet(
		'/teaching/course/list-by-teacher',
		{ teacherId },
		LIVE_API_BASE
	)
	return Array.isArray(data) ? data : asList(data)
}

export async function fetchCourseClasses(courseId) {
	const data = await teachingGet(
		'/teaching/course/list-classes',
		{ courseId },
		LIVE_API_BASE
	)
	return Array.isArray(data) ? data : asList(data)
}

export function submitExamScoreVideo(opts) {
	const formData = {
		examId: String(opts.examId),
		examItemId: String(opts.examItemId),
		studentId: String(opts.studentId),
	}
	if (opts.classId != null && opts.classId !== '') formData.classId = String(opts.classId)
	if (opts.videoDuration != null && opts.videoDuration !== '') {
		formData.videoDuration = String(opts.videoDuration)
	}
	return uniUploadFile(
		`${TEACHING_API_BASE}/teaching/exam-score/submit-video`,
		opts.filePath,
		formData
	)
}

export function fetchExamScoreListByExam(examId) {
	return teachingGet('/teaching/exam-score/list-by-exam', { examId })
}

export function fetchExamScoreGet(id) {
	return teachingGet('/teaching/exam-score/get', { id })
}

export function reviewExamScore(body) {
	return teachingJsonRequest('PUT', '/teaching/exam-score/review', body)
}

export function retryExamScore(id) {
	return teachingJsonRequest(
		'POST',
		`/teaching/exam-score/retry?id=${encodeURIComponent(id)}`,
		{}
	)
}

export function markExamScoreAbsent(body) {
	return teachingJsonRequest('POST', '/teaching/exam-score/mark-absent', body)
}

export function restartExamStudent(body) {
	return teachingJsonRequest('POST', '/teaching/exam-score/restart-student', body)
}

export { TEACHING_API_BASE, LIVE_API_BASE }
