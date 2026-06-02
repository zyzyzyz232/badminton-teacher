<template>
  <view class="page-container">
    <view class="top-bg">
      <view class="circle-bg"></view>
      <view class="header-text-area">
        <text class="app-name">羽球训练营 🏸</text>
        <text class="welcome-text">{{ isRegister ? '加入我们，开启训练' : '欢迎回来，继续挥拍' }}</text>
      </view>
    </view>

    <view class="card-container">
      <view class="form-box">

        <view class="form-title">
          <text>{{ isRegister ? '注册账号' : '账号登录' }}</text>
        </view>

        <view class="input-item" v-if="isRegister">
          <view class="icon-box">👨‍🏫</view>
          <input
            class="input"
            type="text"
            v-model="formData.nickname"
            placeholder="请输入教师姓名"
            placeholder-class="placeholder-style"
            maxlength="30"
          />
        </view>

        <view class="input-item" v-if="isRegister">
          <view class="icon-box">📱</view>
          <input
            class="input"
            type="number"
            v-model="formData.mobile"
            placeholder="请输入手机号"
            placeholder-class="placeholder-style"
            maxlength="11"
          />
        </view>

        <view class="input-item">
          <view class="icon-box">👤</view>
          <input
            class="input"
            type="text"
            v-model="formData.username"
            placeholder="请输入账号"
            placeholder-class="placeholder-style"
            maxlength="30"
          />
        </view>

        <view class="input-item">
          <view class="icon-box">🔒</view>
          <input
            class="input"
            password
            :key="'password-' + formKey"
            @input="handlePasswordInput"
            placeholder="请输入密码"
            placeholder-class="placeholder-style"
          />
        </view>

        <view class="input-item" v-if="isRegister">
          <view class="icon-box">🛡️</view>
          <input
            class="input"
            password
            :key="'confirm-' + formKey"
            @input="handleConfirmPasswordInput"
            placeholder="请再次确认密码"
            placeholder-class="placeholder-style"
          />
        </view>


        <button class="submit-btn" hover-class="btn-hover" @click="handleSubmit">
          {{ isRegister ? '立即注册' : '登 录' }}
        </button>

        <view class="toggle-area">
          <text class="toggle-tips">{{ isRegister ? '已有账号？' : '还没有账号？' }}</text>
          <text class="toggle-btn" @click="toggleMode">
            {{ isRegister ? '去登录' : '立即注册' }}
          </text>
        </view>
      </view>
    </view>

    <view class="footer-area">
      <view class="divider">
        <text class="divider-text">社交账号登录</text>
      </view>
      <view class="social-login">
        <button class="wx-login-btn" @click="handleWechatLogin">
          <text class="wx-icon">💬</text> 微信一键登录
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';

// --- 状态定义 ---
const isRegister = ref(false);
const formKey = ref(0);

const formData = reactive({
  username: '',      // 账号
  nickname: '',      // 教师姓名
  mobile: '',        // 手机号
  password: '',
  confirmPassword: ''
});

// --- 逻辑处理 ---

const handlePasswordInput = (e) => {
  const value = e.detail.value;
  // 微信小程序 password 输入框偶发回传掩码字符，忽略以免覆盖真实密码
  if (value && /^\*+$/.test(value)) return;
  formData.password = value;
};

const handleConfirmPasswordInput = (e) => {
  const value = e.detail.value;
  if (value && /^\*+$/.test(value)) return;
  formData.confirmPassword = value;
};

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  // 切换模式时清空敏感信息，提升体验
  formData.password = '';
  formData.confirmPassword = '';
  formData.username = '';
  formData.nickname = '';
  formData.mobile = '';
  formKey.value++;
};

const handleSubmit = () => {
  // 1. 基础校验
  if (!formData.username) {
    uni.showToast({ title: '请输入账号', icon: 'none' });
    return;
  }
  if (!formData.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }

  if (isRegister.value) {
    if (!formData.nickname) {
       uni.showToast({ title: '请输入教师姓名', icon: 'none' });
       return;
    }
    if (!formData.mobile) {
       uni.showToast({ title: '请输入手机号', icon: 'none' });
       return;
    }
    if (formData.password !== formData.confirmPassword) {
      uni.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
  }

  uni.showLoading({ title: isRegister.value ? '注册中...' : '登录中...' });

  // 新接口配置
  const BASE_URL = "http://10.112.189.54:48080/admin-api/system/auth";
  const requestUrl = isRegister.value ? `${BASE_URL}/teacher-register` : `${BASE_URL}/login`;

  // 构建参数
  let postData;
  if (isRegister.value) {
    // 教师注册参数
    postData = {
      username: formData.username,
      nickname: formData.nickname,
      mobile: formData.mobile,
      password: formData.password
    };
  } else {
    // 登录参数
    postData = {
      username: formData.username,
      password: formData.password
    };
    // 调试：打印登录账号密码
    console.log('[登录调试] 账号:', formData.username, '密码:', formData.password);
  }

  uni.request({
    url: requestUrl,
    method: 'POST',
    header: {
        'content-type': 'application/json',
        'Tenant-Id': '1'
    },
    data: postData,
    success: (res) => {
      uni.hideLoading();
      console.log('后端返回:', res.data);

      if (res.data.code === 0) {
        uni.showToast({ title: isRegister.value ? '注册成功' : '登录成功' });

        if (res.data.data && res.data.data.accessToken) {
             uni.setStorageSync('token', res.data.data.accessToken);
             // 登录成功后获取用户信息
             getUserInfo(res.data.data.accessToken);
        }

        setTimeout(() => {
          // 登录成功跳转到首页（TabBar页面）
          uni.switchTab({ url: '/pages/home/home' });
        }, 1000);

      } else {
        uni.showToast({ title: res.data.msg || '操作失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('请求失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

const handleWechatLogin = () => {
  uni.login({
    provider: 'weixin',
    success: (res) => {
      uni.showToast({ title: '微信授权成功', icon: 'success' });
    }
  });
};

// 获取用户信息并保存到本地存储
// TODO: 新接口的用户信息获取地址需要确认
const getUserInfo = (token) => {
  console.log('获取用户信息，token:', token);
  // 暂时注释掉，等确认新接口后再启用
  // const BASE_URL = "http://10.112.189.54:48080/admin-api/system/user";
  // uni.request({ ... });
};
</script>

<style lang="scss" scoped>
/* 页面容器：浅灰背景 */
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
}

/* 顶部绿色背景区 */
.top-bg {
  height: 420rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c); /* 微信绿渐变 */
  position: relative;
  border-bottom-left-radius: 60rpx;
  border-bottom-right-radius: 60rpx;
  padding-top: 100rpx;
  box-sizing: border-box;
}

/* 顶部装饰圆 */
.circle-bg {
  position: absolute;
  top: -100rpx;
  right: -100rpx;
  width: 300rpx;
  height: 300rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.header-text-area {
  padding-left: 60rpx;
  color: #fff;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.welcome-text {
  font-size: 28rpx;
  opacity: 0.9;
}

/* 卡片容器：向上重叠 */
.card-container {
  margin-top: -120rpx; /* 向上移动，盖住背景 */
  padding: 0 40rpx;
}

.form-box {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 40rpx;
  text-align: center;
}

/* 输入框样式优化 */
.input-item {
  display: flex;
  align-items: center;
  background-color: #f7f8fa; /* 浅灰底色 */
  border-radius: 50rpx; /* 全圆角 */
  padding: 0 30rpx;
  margin-bottom: 30rpx;
  height: 100rpx;
  transition: all 0.3s;

  &:active {
    background-color: #edf0f5;
  }
}

.icon-box {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 50rpx;
  text-align: center;
}

.input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  height: 100%;
}

.placeholder-style {
  color: #c0c4cc;
}

/* 按钮样式 */
.submit-btn {
  margin-top: 50rpx;
  background: linear-gradient(90deg, #07c160, #1aad19);
  color: white;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  height: 90rpx;
  line-height: 90rpx;
  box-shadow: 0 8rpx 20rpx rgba(7, 193, 96, 0.3);

  &::after {
    border: none;
  }
}

.btn-hover {
  opacity: 0.9;
  transform: scale(0.98);
}

/* 底部切换区 */
.toggle-area {
  margin-top: 30rpx;
  text-align: center;
  font-size: 28rpx;
}

.toggle-tips {
  color: #909399;
}

.toggle-btn {
  color: #07c160;
  font-weight: bold;
  margin-left: 10rpx;
  padding: 10rpx;
}

/* 第三方登录 */
.footer-area {
  margin-top: 80rpx;
  text-align: center;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;

  .divider-text {
    font-size: 24rpx;
    color: #ccc;
    background-color: #f5f7fa;
    padding: 0 20rpx;
    position: relative;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    width: 60%;
    height: 1px;
    background-color: #e0e0e0;
    z-index: 0;
  }
}

.wx-login-btn {
  background-color: #fff;
  color: #333;
  font-size: 28rpx;
  border-radius: 50rpx;
  width: 60%;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 80rpx;

  .wx-icon {
    margin-right: 10rpx;
    font-size: 32rpx;
    color: #07c160;
  }

  &::after {
    border: none;
  }
}
</style>
