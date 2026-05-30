export type PlanItem = {
  id: string
  title: string
  durationMin: number
  videoUrl?: string
  instruction?: string
}

export type SessionState = {
  plan: PlanItem[]
  currentItemId: string
  sessionElapsedSec: number
  blockRemainingSec: number
  paused: boolean
  videoPlaying: boolean
  overlaySkeleton: boolean
  overlayError: boolean
  networkOk: boolean
  systemOk: boolean
}
