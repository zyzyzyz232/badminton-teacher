<template>
  <view class="page-container">
    <page-nav-bar title="课程详情" />
    <!-- 顶部课程信息 -->
    <view class="top-bg">
      <view class="course-info">
        <text class="course-name">{{ course.name }}</text>
        <text class="course-class">{{ course.courseClass || '未设置班级' }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 基本信息卡片 -->
      <view class="info-card">
        <view class="card-title">基本信息</view>

        <view class="info-item">
          <text class="info-label">学期</text>
          <text class="info-value">{{ course.semester || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="info-label">上课时间</text>
          <text class="info-value">{{ course.courseTime || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="info-label">教师</text>
          <text class="info-value">{{ course.teacherName || '--' }}</text>
        </view>

        <view class="info-item">
          <text class="info-label">简介</text>
          <text class="info-value">{{ course.description || '暂无简介' }}</text>
        </view>
      </view>

      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stats-title">课程统计</view>
        <view class="stats-grid">
          <view class="stats-item">
            <text class="stats-value">{{ classCount }}</text>
            <text class="stats-label">班级数</text>
          </view>
          <view class="stats-item">
            <text class="stats-value">{{ lessonCount }}</text>
            <text class="stats-label">课堂数</text>
          </view>
        </view>
      </view>

      <!-- 课堂列表入口 -->
      <view class="action-card" @click="goToLessonList">
        <view class="action-left">
          <text class="action-icon">📖</text>
          <view class="action-text">
            <text class="action-title">课堂管理</text>
            <text class="action-desc">查看和管理所有课堂</text>
          </view>
        </view>
        <text class="action-arrow">></text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="delete-btn" @click="showDeleteConfirm">删除课程</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';

// 接口基础地址
const BASE_URL = "http://10.112.189.54:48080/admin-api";

// 页面参数
const courseId = ref(0);

// 课程数据
const course = reactive({
  id: 0,
  name: '',
  courseClass: '',
  semester: '',
  courseTime: '',
  teacherName: '',
  description: ''
});

// 统计数据
const classCount = ref(0);
const lessonCount = ref(0);

// 获取课程详情
const getCourseDetail = () => {
  const token = uni.getStorageSync('token');

  uni.request({
    url: `${BASE_URL}/teaching/course/get?id=${courseId.value}`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    success: (res) => {
      if (res.data.code === 0 && res.data.data) {
        const data = res.data.data;
        course.id = data.id;
        course.name = data.name;
        course.courseClass = data.courseClass;
        course.semester = data.semester;
        course.courseTime = data.courseTime;
        course.teacherName = data.teacherName;
        course.description = data.description;

        // 设置导航栏标题
        uni.setNavigationBarTitle({
          title: data.name || '课程详情'
        });
      }
    }
  });
};

// 获取班级数量
const getClassCount = () => {
  const token = uni.getStorageSync('token');

  uni.request({
    url: `${BASE_URL}/teaching/course/list-classes`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    data: { courseId: courseId.value },
    success: (res) => {
      if (res.data.code === 0 && res.data.data) {
        classCount.value = res.data.data.length;
      }
    }
  });
};

// 获取课堂数量
const getLessonCount = () => {
  const token = uni.getStorageSync('token');

  uni.request({
    url: `${BASE_URL}/teaching/course/list-lessons`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    data: { courseId: courseId.value },
    success: (res) => {
      if (res.data.code === 0 && res.data.data) {
        lessonCount.value = res.data.data.length;
      }
    }
  });
};

// 跳转到课堂列表
const goToLessonList = () => {
  uni.navigateTo({
    url: `/pages/lesson-list/lesson-list?courseId=${courseId.value}&courseName=${course.name}`
  });
};

// 显示删除确认
const showDeleteConfirm = () => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除课程"${course.name}"吗？删除后无法恢复。`,
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        deleteCourse();
      }
    }
  });
};

// 删除课程
const deleteCourse = () => {
  const token = uni.getStorageSync('token');

  uni.showLoading({ title: '删除中...' });

  uni.request({
    url: `${BASE_URL}/teaching/course/delete?id=${courseId.value}`,
    method: 'DELETE',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    success: (res) => {
      uni.hideLoading();
      if (res.data.code === 0) {
        uni.showToast({
          title: '删除成功',
          icon: 'success',
          complete: () => {
            setTimeout(() => {
              // 返回上一页
              uni.navigateBack();
            }, 500);
          }
        });
      } else {
        uni.showToast({ title: res.data.msg || '删除失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('删除失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

// 生命周期
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  courseId.value = parseInt(options.courseId) || 0;

  if (courseId.value) {
    getCourseDetail();
    getClassCount();
    getLessonCount();
  }
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 140rpx;
}

/* 顶部区域 */
.top-bg {
  height: 300rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 60rpx 40rpx;
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
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.course-class {
  font-size: 28rpx;
  opacity: 0.9;
}

/* 内容区域 */
.content-area {
  padding: 30rpx;
  margin-top: -60rpx;
}

/* 信息卡片 */
.info-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

  .card-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
    padding-left: 20rpx;
    border-left: 8rpx solid #07c160;
  }

  .info-item {
    display: flex;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      width: 160rpx;
      font-size: 28rpx;
      color: #999;
    }

    .info-value {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }
  }
}

/* 统计卡片 */
.stats-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

  .stats-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
    padding-left: 20rpx;
    border-left: 8rpx solid #07c160;
  }

  .stats-grid {
    display: flex;
    justify-content: space-around;
  }

  .stats-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .stats-value {
      font-size: 48rpx;
      font-weight: bold;
      color: #07c160;
      margin-bottom: 10rpx;
    }

    .stats-label {
      font-size: 26rpx;
      color: #999;
    }
  }
}

/* 操作卡片 */
.action-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

  &:active {
    opacity: 0.9;
  }

  .action-left {
    display: flex;
    align-items: center;

    .action-icon {
      font-size: 48rpx;
      margin-right: 20rpx;
    }

    .action-text {
      display: flex;
      flex-direction: column;

      .action-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
      }

      .action-desc {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .action-arrow {
    font-size: 32rpx;
    color: #ccc;
  }
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.delete-btn {
  width: 100%;
  height: 90rpx;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    display: none;
  }

  &:active {
    opacity: 0.9;
  }
}
</style>
