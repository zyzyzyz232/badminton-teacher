/** 是否运行在 uni-app H5（浏览器） */
export function isH5Client() {
  try {
    return uni.getSystemInfoSync().uniPlatform === 'web'
  } catch {
    return false
  }
}

/** H5 冷启动是否落在非法的大屏遥控路由（无 planId 参数） */
export function isH5StrayScreenControlRoute() {
  if (!isH5Client() || typeof window === 'undefined') return false
  const hash = window.location.hash || ''
  if (!hash.includes('screen-control')) return false
  return !/[?&]planId=\d+/.test(hash)
}
