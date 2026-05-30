<template>
  <view class="page-container">
    <!-- 顶部课程信息 -->
    <view class="top-bg">
      <view class="course-info">
        <text class="course-name">{{ courseName }}</text>
        <text class="subtitle">请选择班级</text>
      </view>
    </view>

    <!-- 班级列表 -->
    <view class="content-area">
      <view class="section-title">
        <text class="icon">👥</text>
        <text>班级列表</text>
      </view>

      <!-- 班级卡片列表 -->
      <view v-if="classList.length > 0" class="class-list">
        <view
          v-for="item in classList"
          :key="item.classId"
          class="class-card"
          @click="goToClassDetail(item)"
        >
          <view class="class-info">
            <text class="class-name">{{ item.className || '默认班级' }}</text>
            <view class="student-count">
              <text class="count-icon">👤</text>
              <text class="count-text">{{ item.studentCount || 0 }} 人</text>
            </view>
          </view>
          <view class="class-arrow">
            <text class="arrow-icon">></text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无班级</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, onMounted } from 'vue';

// 接口基础地址
const BASE_URL = "http://10.112.189.54:48080/admin-api";

// 页面参数
const courseId = reactive({ value: 0 });
const courseName = reactive({ value: '' });

// 数据定义
const classList = reactive([]);

// 获取班级列表
const getClassList = () => {
  if (!courseId.value) {
    uni.showToast({ title: '课程ID无效', icon: 'none' });
    return;
  }

  const token = uni.getStorageSync('token');
  uni.showLoading({ title: '加载中...' });

  uni.request({
    url: `${BASE_URL}/teaching/course/list-classes`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    data: {
      courseId: courseId.value
    },
    success: (res) => {
      uni.hideLoading();
      if (res.data.code === 0 && res.data.data) {
        classList.length = 0;
        classList.push(...res.data.data);
      } else {
        uni.showToast({ title: res.data.msg || '获取班级失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('请求失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

// 跳转到班级详情页
const goToClassDetail = (item) => {
  uni.navigateTo({
    url: `/pages/class-detail/class-detail?courseId=${courseId.value}&classId=${item.classId}&className=${item.className}`
  });
};

// 生命周期
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  courseId.value = parseInt(options.courseId) || 0;
  courseName.value = options.courseName || '课程详情';

  // 设置导航栏标题
  uni.setNavigationBarTitle({
    title: courseName.value
  });

  getClassList();
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部区域 */
.top-bg {
  height: 220rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 40rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-info {
  text-align: center;
  color: #fff;
}

.course-name {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 26rpx;
  opacity: 0.9;
}

/* 内容区域 */
.content-area {
  padding: 30rpx;
  margin-top: -30rpx;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding: 0 10rpx;

  .icon {
    margin-right: 10rpx;
  }
}

/* 班级卡片 */
.class-list {
  .class-card {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:active {
      opacity: 0.9;
    }
  }

  .class-info {
    flex: 1;

    .class-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 12rpx;
    }

    .student-count {
      display: flex;
      align-items: center;

      .count-icon {
        margin-right: 8rpx;
        font-size: 24rpx;
      }

      .count-text {
        font-size: 26rpx;
        color: #999;
      }
    }
  }

  .class-arrow {
    .arrow-icon {
      font-size: 32rpx;
      color: #ccc;
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 32rpx;
    color: #999;
  }
}
</style>
