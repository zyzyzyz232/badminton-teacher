<template>
  <view class="page-container">
    <page-nav-bar title="班级详情" />
    <!-- 顶部班级信息 -->
    <view class="top-bg">
      <view class="class-info">
        <text class="class-name">{{ className }}</text>
        <text class="subtitle">选择上课模式</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="content-area">
      <view class="action-card">
        <view class="action-title">请选择上课模式</view>

        <view class="action-buttons">
          <view class="action-btn primary" @click="goToLessonList">
            <text class="btn-icon">📖</text>
            <text class="btn-text">上课</text>
            <text class="btn-desc">选择课堂进行教学</text>
          </view>

          <view class="action-btn secondary" @click="goToExamSetup">
            <text class="btn-icon">📝</text>
            <text class="btn-text">考试</text>
            <text class="btn-desc">学生技能考核评测</text>
          </view>
        </view>
      </view>

      <!-- 班级统计信息 -->
      <view class="stats-card">
        <view class="stats-title">班级统计</view>
        <view class="stats-grid">
          <view class="stats-item">
            <text class="stats-value">{{ studentCount }}</text>
            <text class="stats-label">学生人数</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const BASE_URL = 'http://10.112.189.54:48080/admin-api';

// 页面参数
const courseId = ref(0);
const classId = ref(0);
const className = ref('');
const studentCount = ref(0);

const loadStudentCountFromListClasses = () => {
  const cid = courseId.value;
  if (!cid) return;

  const token = uni.getStorageSync('token');
  uni.request({
    url: `${BASE_URL}/teaching/course/list-classes`,
    method: 'GET',
    header: {
      Authorization: `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    data: { courseId: cid },
    success: (res) => {
      if (res.data?.code !== 0 || !Array.isArray(res.data.data)) return;
      const targetId = Number(classId.value);
      const row = res.data.data.find((item) => Number(item.classId) === targetId);
      if (row != null) {
        const n = Number(row.studentCount);
        studentCount.value = Number.isFinite(n) ? n : 0;
      }
    }
  });
};

// 跳转到课堂列表页
const goToLessonList = () => {
  const name = encodeURIComponent(className.value || '');
  uni.navigateTo({
    url: `/pages/lesson-list/lesson-list?courseId=${courseId.value}&classId=${classId.value}&className=${name}`
  });
};

const goToExamSetup = () => {
  const name = encodeURIComponent(className.value || '');
  uni.navigateTo({
    url: `/pages/lesson-list/lesson-list?courseId=${courseId.value}&classId=${classId.value}&className=${name}&forExam=1`
  });
};

function decodeName(raw) {
  if (!raw) return '班级详情';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

onLoad((options) => {
  options = options || {};
  courseId.value = parseInt(options.courseId, 10) || 0;
  classId.value = parseInt(options.classId, 10) || 0;
  className.value = decodeName(options.className);

  uni.setNavigationBarTitle({
    title: className.value
  });

  loadStudentCountFromListClasses();
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部区域 */
.top-bg {
  height: 280rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 60rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.class-info {
  text-align: center;
  color: #fff;
}

.class-name {
  font-size: 44rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

/* 内容区域 */
.content-area {
  padding: 30rpx;
  margin-top: -60rpx;
}

/* 操作卡片 */
.action-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 50rpx;
  border-radius: 20rpx;
  min-width: 240rpx;

  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }

  &.primary {
    background: linear-gradient(135deg, #07c160, #0ebf8c);
  }

  &.secondary {
    background-color: #f5f7fa;
    border: 2rpx solid #e0e0e0;
  }

  .btn-icon {
    font-size: 60rpx;
    margin-bottom: 16rpx;
  }

  .btn-text {
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 8rpx;
  }

  &.primary .btn-text {
    color: #fff;
  }

  &.secondary .btn-text {
    color: #666;
  }

  .btn-desc {
    font-size: 22rpx;
  }

  &.primary .btn-desc {
    color: rgba(255, 255, 255, 0.8);
  }

  &.secondary .btn-desc {
    color: #999;
  }
}

/* 统计卡片 */
.stats-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.stats-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-left: 20rpx;
  border-left: 8rpx solid #07c160;
}

.stats-grid {
  display: flex;
  justify-content: center;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  .stats-value {
    font-size: 40rpx;
    font-weight: bold;
    color: #07c160;
    margin-bottom: 10rpx;
  }

  .stats-label {
    font-size: 26rpx;
    color: #999;
  }
}
</style>
