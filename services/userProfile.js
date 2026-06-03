import { getTeacherIdFromStorage } from './trainingPlanApi.js'

const PROFILE_URL = 'http://10.112.189.54:48080/admin-api/system/user/profile/get'

/**
 * 拉取当前登录用户资料并写入 userInfo 本地缓存
 * @param {string} [token] 不传则读 storage 中的 token
 */
export function fetchAndStoreUserProfile(token) {
  const authToken = token || uni.getStorageSync('token') || ''
  if (!authToken) {
    return Promise.reject(new Error('请先登录'))
  }
  return new Promise((resolve, reject) => {
    uni.request({
      url: PROFILE_URL,
      method: 'GET',
      header: {
        Authorization: `Bearer ${authToken}`,
        'Tenant-Id': '1',
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data?.code === 0 && res.data.data) {
          uni.setStorageSync('userInfo', res.data.data)
          resolve(res.data.data)
          return
        }
        reject(new Error(res.data?.msg || '获取用户信息失败'))
      },
      fail: () => reject(new Error('网络连接异常')),
    })
  })
}

/** 确保 token 与 userInfo（含教师 id）可用 */
export async function ensureTeacherSession() {
  const token = uni.getStorageSync('token') || ''
  if (!token) {
    throw new Error('请先登录')
  }
  let teacherId = getTeacherIdFromStorage()
  if (!teacherId) {
    await fetchAndStoreUserProfile(token)
    teacherId = getTeacherIdFromStorage()
  }
  if (!teacherId) {
    throw new Error('无法获取教师账号信息')
  }
  return { token, teacherId }
}
