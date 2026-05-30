<template>
  <view class="page-container">
    <view class="top-bg">
      <view class="user-header">
        <view class="avatar-box">
          <image v-if="userInfo.avatar" class="avatar-img" :src="userInfo.avatar" mode="aspectFill" />
          <text v-else class="avatar-text">🏸</text>
        </view>
        <view class="user-info-text">
          <text class="name">{{ userInfo.nickname || '教师' }}</text>
          <text class="id-text">账号: {{ userInfo.username || '--' }}</text>
        </view>
      </view>
    </view>

    <view class="content-area">

      <view class="card">
        <view class="card-title">📝 基本资料</view>

        <view class="info-item">
          <text class="label">昵称</text>
          <text class="value">{{ userInfo.nickname || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="label">性别</text>
          <text class="value">{{ sexText }}</text>
        </view>

        <view class="info-item">
          <text class="label">手机号</text>
          <text class="value">{{ userInfo.mobile || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="label">邮箱</text>
          <text class="value">{{ userInfo.email || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="label">部门</text>
          <text class="value">{{ userInfo.dept?.name || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="label">角色</text>
          <text class="value">{{ rolesText }}</text>
        </view>

        <view class="info-item">
          <text class="label">岗位</text>
          <text class="value">{{ postsText }}</text>
        </view>

        <button class="action-btn outline-btn" @click="showDevTip">编辑资料</button>
      </view>

      <view class="card">
        <view class="card-title">📊 账号信息</view>

        <view class="info-item">
          <text class="label">用户ID</text>
          <text class="value">{{ userInfo.id || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="label">登录IP</text>
          <text class="value">{{ userInfo.loginIp || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="label">登录时间</text>
          <text class="value">{{ formatTime(userInfo.loginDate) }}</text>
        </view>

        <view class="info-item">
          <text class="label">注册时间</text>
          <text class="value">{{ formatTime(userInfo.createTime) }}</text>
        </view>
      </view>

      <view class="card">
        <view class="card-title">🔒 安全设置</view>

        <view class="info-item" @click="showDevTip">
          <text class="label">修改密码</text>
          <text class="arrow">></text>
        </view>
      </view>

      <button class="logout-btn" @click="handleLogout">退出登录</button>

    </view>
  </view>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 接口基础地址
const BASE_URL = "http://10.112.189.54:48080/admin-api";

// --- 数据定义 ---
const userInfo = reactive({
  id: 0,
  username: '',
  nickname: '',
  avatar: '',
  mobile: '',
  email: '',
  sex: 0,
  dept: null,
  roles: [],
  posts: [],
  loginIp: '',
  loginDate: '',
  createTime: ''
});

// 性别文本
const sexText = computed(() => {
  const map = { 0: '保密', 1: '男', 2: '女' };
  return map[userInfo.sex] || '保密';
});

// 角色文本
const rolesText = computed(() => {
  if (!userInfo.roles || userInfo.roles.length === 0) return '--';
  return userInfo.roles.map(r => r.name).join('、');
});

// 岗位文本
const postsText = computed(() => {
  if (!userInfo.posts || userInfo.posts.length === 0) return '--';
  return userInfo.posts.map(p => p.name).join('、');
});

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '--';
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// --- 生命周期 ---
onShow(() => {
  getUserProfile();
});

// --- 方法定义 ---

// 1. 获取用户信息
const getUserProfile = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  uni.request({
    url: `${BASE_URL}/system/user/profile/get`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    success: (res) => {
      if (res.data.code === 0 && res.data.data) {
        // 将获取到的数据填充到 userInfo
        Object.assign(userInfo, res.data.data);
        // 保存到本地存储
        uni.setStorageSync('userInfo', res.data.data);
        console.log('用户信息已获取:', res.data.data);
      } else {
        console.error('获取用户信息失败:', res);
        uni.showToast({ title: res.data.msg || '获取信息失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('请求失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

// 2. 显示功能开发中提示
const showDevTip = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' });
};

// 3. 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        // 跳转回登录页
        uni.reLaunch({
          url: '/pages/index/index'
        });
      }
    }
  });
};
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部区域 */
.top-bg {
  height: 320rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 60rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.user-header {
  display: flex;
  align-items: center;
}

.avatar-box {
  width: 120rpx;
  height: 120rpx;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  border: 4rpx solid rgba(255,255,255,0.3);
  overflow: hidden;
}

.avatar-text {
  font-size: 60rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.user-info-text {
  color: #fff;
}

.name {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.id-text {
  font-size: 24rpx;
  opacity: 0.8;
}

/* 内容区域 */
.content-area {
  padding: 0 30rpx;
  margin-top: -60rpx; /* 向上重叠 */
}

.card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  border-left: 8rpx solid #07c160;
  padding-left: 20rpx;
  margin-bottom: 30rpx;
  color: #333;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}

.label {
  font-size: 28rpx;
  color: #666;
}

.value {
  font-size: 28rpx;
  color: #333;
}

.arrow {
  font-size: 28rpx;
  color: #999;
}

/* 按钮样式 */
.action-btn {
  background-color: #07c160;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  margin-top: 20rpx;

  &::after { border: none; }

  &:active { opacity: 0.9; }
}

.outline-btn {
  background-color: #fff;
  color: #07c160;
  border: 2rpx solid #07c160;

  &:active { background-color: #f0f9eb; }
}

.logout-btn {
  background-color: #ff4d4f;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  margin-bottom: 60rpx;

  &::after { border: none; }
}
</style>
