export type PlanItem = {
  id: string
  title: string
  durationMin: number
  videoUrl?: string
  imageUrl?: string
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
  /** 教师端 accessToken，供大屏经中继代理拉取需鉴权的视频 */
  mediaBearerToken?: string
  /** 与 admin-api 请求一致的租户 id */
  mediaTenantId?: string
}
