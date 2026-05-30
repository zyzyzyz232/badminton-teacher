import type { PlanItem, SessionState } from './session.js'

export function createInitialState(): SessionState {
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
  }
}

export function tickState(s: SessionState): SessionState {
  if (s.paused) return s
  return {
    ...s,
    sessionElapsedSec: s.sessionElapsedSec + 1,
    blockRemainingSec: Math.max(0, s.blockRemainingSec - 1),
  }
}

function normalizePlanItem(raw: unknown): PlanItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.title !== 'string') return null
  const durationMin =
    typeof o.durationMin === 'number' && Number.isFinite(o.durationMin)
      ? Math.max(1, Math.round(o.durationMin))
      : null
  if (durationMin === null) return null
  const item: PlanItem = { id: o.id, title: o.title, durationMin }
  if (typeof o.videoUrl === 'string' && o.videoUrl.length > 0) item.videoUrl = o.videoUrl
  if (typeof o.instruction === 'string' && o.instruction.length > 0)
    item.instruction = o.instruction
  return item
}

export type SessionCommand =
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'setCurrentItem'; id: string }
  | { kind: 'setItemDuration'; id: string; durationMin: number }
  | { kind: 'toggleVideo' }
  | { kind: 'setVideoPlaying'; playing: boolean }
  | { kind: 'toggleSkeleton' }
  | { kind: 'toggleErrorOverlay' }
  | { kind: 'resetBlockTimer' }
  | { kind: 'setPlan'; plan: PlanItem[]; currentItemId?: string }

export function applyCommand(s: SessionState, cmd: SessionCommand): SessionState {
  switch (cmd.kind) {
    case 'pause':
      return { ...s, paused: true }
    case 'resume':
      return { ...s, paused: false }
    case 'setCurrentItem': {
      if (!s.plan.some((p) => p.id === cmd.id)) return s
      const item = s.plan.find((p) => p.id === cmd.id)!
      return {
        ...s,
        currentItemId: cmd.id,
        blockRemainingSec: item.durationMin * 60,
        videoPlaying: false,
      }
    }
    case 'setItemDuration': {
      const d = Math.max(1, Math.round(cmd.durationMin))
      const plan = s.plan.map((p) => (p.id === cmd.id ? { ...p, durationMin: d } : p))
      const cap = d * 60
      const blockRemainingSec =
        cmd.id === s.currentItemId ? Math.min(s.blockRemainingSec, cap) : s.blockRemainingSec
      return { ...s, plan, blockRemainingSec }
    }
    case 'toggleVideo':
      return { ...s, videoPlaying: !s.videoPlaying }
    case 'setVideoPlaying':
      return { ...s, videoPlaying: cmd.playing }
    case 'toggleSkeleton':
      return { ...s, overlaySkeleton: !s.overlaySkeleton }
    case 'toggleErrorOverlay':
      return { ...s, overlayError: !s.overlayError }
    case 'resetBlockTimer': {
      const item = s.plan.find((p) => p.id === s.currentItemId)
      if (!item) return s
      return { ...s, blockRemainingSec: item.durationMin * 60 }
    }
    case 'setPlan': {
      const plan = cmd.plan
      if (plan.length === 0) return s
      let currentItemId = cmd.currentItemId
      if (!currentItemId || !plan.some((p) => p.id === currentItemId)) {
        currentItemId = plan[0]!.id
      }
      const item = plan.find((p) => p.id === currentItemId)!
      return {
        ...s,
        plan,
        currentItemId,
        blockRemainingSec: item.durationMin * 60,
        videoPlaying: false,
        paused: true,
      }
    }
    default:
      return s
  }
}

export function parseWireCommand(
  name: string,
  payload?: Record<string, unknown>,
): SessionCommand | null {
  switch (name) {
    case 'pause':
      return { kind: 'pause' }
    case 'resume':
      return { kind: 'resume' }
    case 'setCurrentItem':
      if (typeof payload?.id !== 'string') return null
      return { kind: 'setCurrentItem', id: payload.id }
    case 'setItemDuration':
      if (typeof payload?.id !== 'string' || typeof payload?.durationMin !== 'number')
        return null
      return {
        kind: 'setItemDuration',
        id: payload.id,
        durationMin: payload.durationMin,
      }
    case 'toggleVideo':
      return { kind: 'toggleVideo' }
    case 'setVideoPlaying':
      if (typeof payload?.playing !== 'boolean') return null
      return { kind: 'setVideoPlaying', playing: payload.playing }
    case 'toggleSkeleton':
      return { kind: 'toggleSkeleton' }
    case 'toggleErrorOverlay':
      return { kind: 'toggleErrorOverlay' }
    case 'resetBlockTimer':
      return { kind: 'resetBlockTimer' }
    case 'setPlan': {
      const raw = payload?.plan
      if (!Array.isArray(raw) || raw.length === 0) return null
      const plan: PlanItem[] = []
      for (const row of raw) {
        const item = normalizePlanItem(row)
        if (item) plan.push(item)
      }
      if (plan.length === 0) return null
      const currentItemId =
        typeof payload?.currentItemId === 'string' ? payload.currentItemId : undefined
      return { kind: 'setPlan', plan, currentItemId }
    }
    default:
      return null
  }
}
