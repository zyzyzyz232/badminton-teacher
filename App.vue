<script>
import { isH5StrayScreenControlRoute } from './utils/platform.js'

function redirectH5ToTeacherEntry() {
  const token = uni.getStorageSync('token')
  if (token) {
    uni.switchTab({ url: '/pages/home/home' })
  } else {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

export default {
  onLaunch() {
    // #ifdef H5
    if (isH5StrayScreenControlRoute()) {
      setTimeout(redirectH5ToTeacherEntry, 0)
    }
    // #endif
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
}
</script>

<style>
	/*每个页面公共css */
</style>
