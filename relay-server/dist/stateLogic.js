export function createInitialState() {
    return {
        plan: [],
        currentItemId: '',
        sessionElapsedSec: 0,
        blockRemainingSec: 0,
        paused: true,
        videoPlaying: false,
        overlaySkeleton: false,
        overlayError: false,
        networkOk: true,
        systemOk: true,
        mode: 'training',
        examPhase: 'idle',
        examTitle: '',
        examId: '',
        examItems: [],
        currentExamItemId: '',
        examinees: [],
        currentExamineeId: '',
    };
}
export function tickState(s) {
    if (s.mode === 'exam')
        return s;
    if (s.paused)
        return s;
    return {
        ...s,
        sessionElapsedSec: s.sessionElapsedSec + 1,
        blockRemainingSec: Math.max(0, s.blockRemainingSec - 1),
    };
}
function asId(raw) {
    if (typeof raw === 'string' && raw.trim())
        return raw.trim();
    if (typeof raw === 'number' && Number.isFinite(raw))
        return String(raw);
    return '';
}
function asOptionalNumber(raw) {
    if (typeof raw === 'number' && Number.isFinite(raw))
        return raw;
    if (typeof raw === 'string' && raw.trim()) {
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}
function normalizePlanItem(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    const id = asId(o.id);
    if (!id || typeof o.title !== 'string')
        return null;
    const durationMin = typeof o.durationMin === 'number' && Number.isFinite(o.durationMin)
        ? Math.max(1, Math.round(o.durationMin))
        : null;
    if (durationMin === null)
        return null;
    const item = { id, title: o.title, durationMin };
    if (typeof o.videoUrl === 'string' && o.videoUrl.length > 0)
        item.videoUrl = o.videoUrl;
    if (typeof o.imageUrl === 'string' && o.imageUrl.length > 0)
        item.imageUrl = o.imageUrl;
    if (typeof o.instruction === 'string' && o.instruction.length > 0)
        item.instruction = o.instruction;
    return item;
}
function normalizeExamItem(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    const id = asId(o.id);
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    if (!id || !title)
        return null;
    const item = { id, title };
    const maxScore = asOptionalNumber(o.maxScore);
    if (maxScore != null)
        item.maxScore = maxScore;
    const weight = asOptionalNumber(o.weight);
    if (weight != null)
        item.weight = weight;
    const algoType = asOptionalNumber(o.algoType);
    if (algoType != null)
        item.algoType = algoType;
    if (typeof o.videoUrl === 'string' && o.videoUrl.length > 0)
        item.videoUrl = o.videoUrl;
    if (typeof o.imageUrl === 'string' && o.imageUrl.length > 0)
        item.imageUrl = o.imageUrl;
    if (typeof o.instruction === 'string' && o.instruction.length > 0)
        item.instruction = o.instruction;
    return item;
}
function normalizeExaminee(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    const classStudentId = asId(o.classStudentId ?? o.id);
    if (!classStudentId)
        return null;
    const name = typeof o.name === 'string' && o.name.trim()
        ? o.name.trim()
        : typeof o.studentName === 'string' && o.studentName.trim()
            ? o.studentName.trim()
            : '未命名';
    const statusRaw = typeof o.status === 'string' ? o.status : 'waiting';
    const status = statusRaw === 'testing' || statusRaw === 'done' || statusRaw === 'absent'
        ? statusRaw
        : 'waiting';
    const item = { classStudentId, name, status };
    const userId = asId(o.userId);
    if (userId)
        item.userId = userId;
    const studentNo = asId(o.studentNo);
    if (studentNo)
        item.studentNo = studentNo;
    return item;
}
function isRunnableStatus(status) {
    return status === 'waiting' || status === 'testing';
}
/** Next examinee after `fromIdx` who is still waiting/testing (skip done/absent). */
function nextRunnableIndex(examinees, fromIdx) {
    for (let i = fromIdx + 1; i < examinees.length; i++) {
        if (isRunnableStatus(examinees[i].status))
            return i;
    }
    return -1;
}
const TRAINING_ONLY_KINDS = new Set([
    'pause',
    'resume',
    'setCurrentItem',
    'setItemDuration',
    'toggleVideo',
    'setVideoPlaying',
    'resetBlockTimer',
    'setPlan',
]);
export function isTrainingOnlyCommand(kind) {
    return TRAINING_ONLY_KINDS.has(kind);
}
export function examCommandPhaseError(s, cmd) {
    switch (cmd.kind) {
        case 'setExamBriefing':
            return null;
        case 'setExamItem':
        case 'setExamVideoPlaying':
            if (s.mode !== 'exam' || s.examPhase !== 'briefing') {
                return { code: 'bad_command', message: '当前考试阶段不支持该命令' };
            }
            return null;
        case 'startExam':
            if (s.mode !== 'exam' || s.examPhase !== 'briefing') {
                return { code: 'bad_command', message: '请先下发考核项后再开始考试' };
            }
            return null;
        case 'setCurrentExaminee':
        case 'advanceExaminee':
        case 'markExamineeAbsent':
        case 'restartExaminee':
            if (s.mode !== 'exam' || s.examPhase !== 'running') {
                return { code: 'bad_command', message: '当前考试阶段不支持该命令' };
            }
            return null;
        case 'finishExam':
            if (s.mode !== 'exam' || s.examPhase !== 'running') {
                return { code: 'bad_command', message: '当前考试阶段不支持该命令' };
            }
            return null;
        case 'exitExamMode':
            if (s.mode !== 'exam') {
                return { code: 'bad_command', message: '当前不是考试模式' };
            }
            return null;
        default:
            return null;
    }
}
export function applyCommand(s, cmd) {
    switch (cmd.kind) {
        case 'pause':
            return { ...s, paused: true };
        case 'resume':
            return { ...s, paused: false };
        case 'setCurrentItem': {
            if (!s.plan.some((p) => p.id === cmd.id))
                return s;
            const item = s.plan.find((p) => p.id === cmd.id);
            return {
                ...s,
                currentItemId: cmd.id,
                blockRemainingSec: item.durationMin * 60,
                videoPlaying: false,
            };
        }
        case 'setItemDuration': {
            const d = Math.max(1, Math.round(cmd.durationMin));
            const plan = s.plan.map((p) => (p.id === cmd.id ? { ...p, durationMin: d } : p));
            const cap = d * 60;
            const blockRemainingSec = cmd.id === s.currentItemId ? Math.min(s.blockRemainingSec, cap) : s.blockRemainingSec;
            return { ...s, plan, blockRemainingSec };
        }
        case 'toggleVideo':
            return { ...s, videoPlaying: !s.videoPlaying };
        case 'setVideoPlaying':
            return { ...s, videoPlaying: cmd.playing };
        case 'toggleSkeleton':
            return { ...s, overlaySkeleton: !s.overlaySkeleton };
        case 'toggleErrorOverlay':
            return { ...s, overlayError: !s.overlayError };
        case 'resetBlockTimer': {
            const item = s.plan.find((p) => p.id === s.currentItemId);
            if (!item)
                return s;
            return { ...s, blockRemainingSec: item.durationMin * 60 };
        }
        case 'setMediaAuth':
            return {
                ...s,
                mediaBearerToken: cmd.token,
                ...(cmd.tenantId ? { mediaTenantId: cmd.tenantId } : {}),
            };
        case 'setPlan': {
            const plan = cmd.plan;
            if (plan.length === 0)
                return s;
            let currentItemId = cmd.currentItemId;
            if (!currentItemId || !plan.some((p) => p.id === currentItemId)) {
                currentItemId = plan[0].id;
            }
            const item = plan.find((p) => p.id === currentItemId);
            return {
                ...s,
                plan,
                currentItemId,
                blockRemainingSec: item.durationMin * 60,
                videoPlaying: false,
                paused: true,
                mediaBearerToken: cmd.mediaBearerToken ?? s.mediaBearerToken,
            };
        }
        case 'setExamBriefing': {
            const items = cmd.items;
            if (items.length === 0)
                return s;
            let currentExamItemId = cmd.currentItemId;
            if (!currentExamItemId || !items.some((p) => p.id === currentExamItemId)) {
                currentExamItemId = items[0].id;
            }
            const examinees = (cmd.examinees || []).map((e) => ({ ...e, status: 'waiting' }));
            let currentExamineeId = cmd.currentExamineeId || '';
            if (examinees.length) {
                if (!currentExamineeId || !examinees.some((e) => e.classStudentId === currentExamineeId)) {
                    currentExamineeId = examinees[0].classStudentId;
                }
            }
            else {
                currentExamineeId = '';
            }
            return {
                ...s,
                mode: 'exam',
                examPhase: 'briefing',
                examTitle: cmd.examTitle,
                examId: cmd.examId || '',
                examItems: items,
                currentExamItemId,
                examinees,
                currentExamineeId,
                videoPlaying: false,
                paused: true,
                mediaBearerToken: cmd.mediaBearerToken ?? s.mediaBearerToken,
                ...(cmd.mediaTenantId ? { mediaTenantId: cmd.mediaTenantId } : {}),
            };
        }
        case 'setExamItem': {
            if (s.mode !== 'exam' || s.examPhase !== 'briefing')
                return s;
            if (!s.examItems.some((p) => p.id === cmd.id))
                return s;
            return { ...s, currentExamItemId: cmd.id, videoPlaying: false };
        }
        case 'setExamVideoPlaying': {
            if (s.mode !== 'exam' || s.examPhase !== 'briefing')
                return s;
            return { ...s, videoPlaying: cmd.playing };
        }
        case 'startExam': {
            if (s.mode !== 'exam' || s.examPhase !== 'briefing')
                return s;
            if (cmd.examinees.length === 0)
                return s;
            let currentExamineeId = cmd.currentExamineeId || '';
            if (!currentExamineeId || !cmd.examinees.some((e) => e.classStudentId === currentExamineeId)) {
                currentExamineeId = cmd.examinees[0].classStudentId;
            }
            const examinees = cmd.examinees.map((e) => ({
                ...e,
                status: (e.classStudentId === currentExamineeId ? 'testing' : 'waiting'),
            }));
            return {
                ...s,
                examPhase: 'running',
                examinees,
                currentExamineeId,
                videoPlaying: false,
            };
        }
        case 'setCurrentExaminee': {
            if (s.mode !== 'exam' || s.examPhase !== 'running')
                return s;
            const target = s.examinees.find((e) => e.classStudentId === cmd.classStudentId);
            if (!target || target.status === 'absent')
                return s;
            const examinees = s.examinees.map((e) => {
                if (e.classStudentId === cmd.classStudentId)
                    return { ...e, status: 'testing' };
                if (e.status === 'testing')
                    return { ...e, status: 'waiting' };
                return e;
            });
            return { ...s, examinees, currentExamineeId: cmd.classStudentId };
        }
        case 'advanceExaminee': {
            if (s.mode !== 'exam' || s.examPhase !== 'running')
                return s;
            const idx = s.examinees.findIndex((e) => e.classStudentId === s.currentExamineeId);
            if (idx < 0)
                return s;
            const nextIdx = nextRunnableIndex(s.examinees, idx);
            const examinees = s.examinees.map((e, i) => {
                if (i === idx)
                    return { ...e, status: 'done' };
                if (nextIdx >= 0 && i === nextIdx)
                    return { ...e, status: 'testing' };
                return e;
            });
            const currentExamineeId = nextIdx >= 0 ? s.examinees[nextIdx].classStudentId : s.examinees[idx].classStudentId;
            return { ...s, examinees, currentExamineeId };
        }
        case 'markExamineeAbsent': {
            if (s.mode !== 'exam' || s.examPhase !== 'running')
                return s;
            const idx = s.examinees.findIndex((e) => e.classStudentId === cmd.classStudentId);
            if (idx < 0)
                return s;
            const wasCurrent = s.examinees[idx].classStudentId === s.currentExamineeId;
            const nextIdx = wasCurrent ? nextRunnableIndex(s.examinees, idx) : -1;
            const examinees = s.examinees.map((e, i) => {
                if (i === idx)
                    return { ...e, status: 'absent' };
                if (wasCurrent && nextIdx >= 0 && i === nextIdx)
                    return { ...e, status: 'testing' };
                return e;
            });
            const currentExamineeId = wasCurrent && nextIdx >= 0
                ? s.examinees[nextIdx].classStudentId
                : wasCurrent
                    ? s.examinees[idx].classStudentId
                    : s.currentExamineeId;
            return { ...s, examinees, currentExamineeId };
        }
        case 'restartExaminee': {
            if (s.mode !== 'exam' || s.examPhase !== 'running')
                return s;
            if (!s.examinees.some((e) => e.classStudentId === cmd.classStudentId))
                return s;
            const examinees = s.examinees.map((e) => {
                if (e.classStudentId === cmd.classStudentId)
                    return { ...e, status: 'testing' };
                if (e.status === 'testing')
                    return { ...e, status: 'waiting' };
                return e;
            });
            return { ...s, examinees, currentExamineeId: cmd.classStudentId };
        }
        case 'finishExam': {
            if (s.mode !== 'exam' || s.examPhase !== 'running')
                return s;
            return { ...s, examPhase: 'finished', videoPlaying: false };
        }
        case 'exitExamMode': {
            if (s.mode !== 'exam')
                return s;
            const next = createInitialState();
            if (s.mediaBearerToken)
                next.mediaBearerToken = s.mediaBearerToken;
            if (s.mediaTenantId)
                next.mediaTenantId = s.mediaTenantId;
            return next;
        }
        default:
            return s;
    }
}
export function parseWireCommand(name, payload) {
    switch (name) {
        case 'pause':
            return { kind: 'pause' };
        case 'resume':
            return { kind: 'resume' };
        case 'setCurrentItem':
            if (typeof payload?.id !== 'string' && typeof payload?.id !== 'number')
                return null;
            {
                const id = asId(payload?.id);
                if (!id)
                    return null;
                return { kind: 'setCurrentItem', id };
            }
        case 'setItemDuration':
            if (payload?.id == null || typeof payload?.durationMin !== 'number')
                return null;
            {
                const id = asId(payload.id);
                if (!id)
                    return null;
                return {
                    kind: 'setItemDuration',
                    id,
                    durationMin: payload.durationMin,
                };
            }
        case 'toggleVideo':
            return { kind: 'toggleVideo' };
        case 'setVideoPlaying':
            if (typeof payload?.playing !== 'boolean')
                return null;
            return { kind: 'setVideoPlaying', playing: payload.playing };
        case 'toggleSkeleton':
            return { kind: 'toggleSkeleton' };
        case 'toggleErrorOverlay':
            return { kind: 'toggleErrorOverlay' };
        case 'resetBlockTimer':
            return { kind: 'resetBlockTimer' };
        case 'setMediaAuth': {
            const token = typeof payload?.token === 'string'
                ? payload.token.trim()
                : typeof payload?.mediaBearerToken === 'string'
                    ? payload.mediaBearerToken.trim()
                    : '';
            if (!token)
                return null;
            const tenantId = typeof payload?.tenantId === 'string' && payload.tenantId.trim()
                ? payload.tenantId.trim()
                : undefined;
            return { kind: 'setMediaAuth', token, tenantId };
        }
        case 'setPlan': {
            const raw = payload?.plan;
            if (!Array.isArray(raw) || raw.length === 0)
                return null;
            const plan = [];
            for (const row of raw) {
                const item = normalizePlanItem(row);
                if (item)
                    plan.push(item);
            }
            if (plan.length === 0)
                return null;
            const currentItemId = asId(payload?.currentItemId) || undefined;
            const mediaBearerToken = typeof payload?.mediaBearerToken === 'string' && payload.mediaBearerToken.trim()
                ? payload.mediaBearerToken.trim()
                : undefined;
            return { kind: 'setPlan', plan, currentItemId, mediaBearerToken };
        }
        case 'setExamBriefing': {
            const raw = payload?.items;
            if (!Array.isArray(raw) || raw.length === 0)
                return null;
            const items = [];
            for (const row of raw) {
                const item = normalizeExamItem(row);
                if (item)
                    items.push(item);
            }
            if (items.length === 0)
                return null;
            const examTitle = typeof payload?.examTitle === 'string' ? payload.examTitle.trim() : '';
            const examId = asId(payload?.examId) || undefined;
            const currentItemId = asId(payload?.currentItemId) || undefined;
            const mediaBearerToken = typeof payload?.mediaBearerToken === 'string' && payload.mediaBearerToken.trim()
                ? payload.mediaBearerToken.trim()
                : undefined;
            const mediaTenantId = typeof payload?.mediaTenantId === 'string' && payload.mediaTenantId.trim()
                ? payload.mediaTenantId.trim()
                : undefined;
            const examinees = [];
            if (Array.isArray(payload?.examinees)) {
                for (const row of payload.examinees) {
                    const item = normalizeExaminee(row);
                    if (item)
                        examinees.push(item);
                }
            }
            const currentExamineeId = asId(payload?.currentExamineeId) || undefined;
            return {
                kind: 'setExamBriefing',
                examTitle,
                examId,
                items,
                currentItemId,
                mediaBearerToken,
                mediaTenantId,
                examinees: examinees.length ? examinees : undefined,
                currentExamineeId,
            };
        }
        case 'setExamItem': {
            const id = asId(payload?.id);
            if (!id)
                return null;
            return { kind: 'setExamItem', id };
        }
        case 'setExamVideoPlaying':
            if (typeof payload?.playing !== 'boolean')
                return null;
            return { kind: 'setExamVideoPlaying', playing: payload.playing };
        case 'startExam': {
            const raw = payload?.examinees;
            if (!Array.isArray(raw) || raw.length === 0)
                return null;
            const examinees = [];
            for (const row of raw) {
                const item = normalizeExaminee(row);
                if (item)
                    examinees.push(item);
            }
            if (examinees.length === 0)
                return null;
            const currentExamineeId = asId(payload?.currentExamineeId) || undefined;
            return { kind: 'startExam', examinees, currentExamineeId };
        }
        case 'setCurrentExaminee': {
            const classStudentId = asId(payload?.classStudentId);
            if (!classStudentId)
                return null;
            return { kind: 'setCurrentExaminee', classStudentId };
        }
        case 'advanceExaminee':
            return { kind: 'advanceExaminee' };
        case 'markExamineeAbsent': {
            const classStudentId = asId(payload?.classStudentId);
            if (!classStudentId)
                return null;
            return { kind: 'markExamineeAbsent', classStudentId };
        }
        case 'restartExaminee': {
            const classStudentId = asId(payload?.classStudentId);
            if (!classStudentId)
                return null;
            return { kind: 'restartExaminee', classStudentId };
        }
        case 'finishExam':
            return { kind: 'finishExam' };
        case 'exitExamMode':
            return { kind: 'exitExamMode' };
        default:
            return null;
    }
}
