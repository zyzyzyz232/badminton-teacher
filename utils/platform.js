/** 优先用新 API，避免 wx.getSystemInfoSync 弃用告警 */
function readSystemInfo() {
  try {
    const app = typeof uni.getAppBaseInfo === 'function' ? uni.getAppBaseInfo() || {} : {}
    const win = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() || {} : {}
    const dev = typeof uni.getDeviceInfo === 'function' ? uni.getDeviceInfo() || {} : {}
    if (app.uniPlatform || win.statusBarHeight != null || dev.platform) {
      return { ...dev, ...win, ...app }
    }
  } catch {
    /* fall through */
  }
  return uni.getSystemInfoSync()
}

/** 是否运行在 uni-app H5（浏览器） */
export function isH5Client() {
  try {
    return readSystemInfo().uniPlatform === 'web'
  } catch {
    return false
  }
}

/** 是否微信小程序 */
export function isMpWeixin() {
  try {
    return readSystemInfo().uniPlatform === 'mp-weixin'
  } catch {
    return false
  }
}

/** 微信开发者工具（模拟器）— 可连 127.0.0.1 */
export function isMpWeixinDevtools() {
  try {
    const sys = readSystemInfo()
    return sys.uniPlatform === 'mp-weixin' && sys.platform === 'devtools'
  } catch {
    return false
  }
}

/** 微信小程序真机 */
export function isMpWeixinDevice() {
  return isMpWeixin() && !isMpWeixinDevtools()
}

/** H5 冷启动是否落在非法的大屏遥控路由（无 planId 参数） */
export function isH5StrayScreenControlRoute() {
  if (!isH5Client() || typeof window === 'undefined') return false
  const hash = window.location.hash || ''
  if (!hash.includes('screen-control')) return false
  return !/[?&]planId=\d+/.test(hash)
}
