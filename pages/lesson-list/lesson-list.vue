<template>
  <view class="page-container">
    <!-- 顶部班级信息 -->
    <view class="top-bg">
      <view class="lesson-info">
        <text class="class-name">{{ className }}</text>
        <text class="subtitle">{{ forExam ? '选择课堂进行考试' : '课堂列表' }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 创建按钮 -->
      <view class="create-section">
        <view class="section-title">
          <text class="icon">📅</text>
          <text>{{ forExam ? '选择课堂' : '课堂列表' }}</text>
        </view>
        <view v-if="!forExam" class="create-btn" @click="goToCreateLesson">
          <text class="create-icon">+</text>
          <text>创建课堂</text>
        </view>
      </view>

      <!-- 课堂卡片列表 -->
      <view v-if="lessonList.length > 0" class="lesson-list">
        <view
          v-for="(item, idx) in lessonList"
          :key="resolveLessonRowId(item) || 'lesson-' + idx"
          class="lesson-card"
        >
          <!-- 卡片头部：点击可进入课堂 -->
          <view class="card-main" @click.stop="onCardMainClick(item)">
            <view class="lesson-header">
              <view class="lesson-week">
                <text class="week-num">第{{ item.weekIndex }}周</text>
                <text class="lesson-type">{{ item.typeText || '普通课堂' }}</text>
              </view>
              <text class="lesson-status" :class="getStatusClass(item.status)">
                {{ item.statusText || '未开始' }}
              </text>
            </view>

            <view class="lesson-time">
              <text class="time-icon">🕐</text>
              <text class="time-text">{{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}</text>
            </view>

            <view class="lesson-footer">
              <text class="teacher-name">授课教师：{{ item.teacherName || '--' }}</text>
            </view>
          </view>

          <!-- 操作按钮区 -->
          <view class="card-actions">
            <view v-if="!forExam" class="action-btn delete" @click.stop="deleteLesson(item)">
              <text>删除</text>
            </view>
            <view class="action-btn enter" @click.stop="enterLesson(item)">
              <text>{{ forExam ? '考试设置' : '进入课堂' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无课堂</text>
        <text class="empty-tip">点击上方"创建课堂"按钮添加</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow, onLoad } from '@dcloudio/uni-app';

// 接口基础地址
const BASE_URL = "http://10.112.189.54:48080/admin-api";

// 页面参数
const courseId = ref(0);
const classId = ref(0);
const className = ref('');

// 数据定义
const lessonList = ref([]);
/** 从班级详情「考试」进入：先选课堂再选场地 */
const forExam = ref(false);

// 获取token
const getToken = () => {
  return uni.getStorageSync('token') || '';
};

// 获取课堂列表
const getLessonList = () => {
  if (!courseId.value) {
    uni.showToast({ title: '课程ID无效', icon: 'none' });
    return;
  }

  const token = getToken();
  uni.showLoading({ title: '加载中...' });

  uni.request({
    url: `${BASE_URL}/teaching/course/list-lessons`,
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
        lessonList.value = res.data.data;
      } else {
        uni.showToast({ title: res.data.msg || '获取课堂失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('请求失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

/** 列表接口可能返回 id 或 lessonId */
function resolveLessonRowId(item) {
  const v = item?.id ?? item?.lessonId;
  if (v === undefined || v === null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
}

// 跳转到创建课堂页
const goToCreateLesson = () => {
  const name = encodeURIComponent(className.value || '');
  uni.navigateTo({
    url: `/pages/lesson-create/lesson-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}`
  });
};

// 删除课堂
const deleteLesson = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除「第${item.weekIndex}周」的课堂吗？\n此操作不可恢复！`,
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        doDeleteLesson(resolveLessonRowId(item));
      }
    }
  });
};

// 执行删除
const doDeleteLesson = (lessonId) => {
  const token = getToken();
  uni.showLoading({ title: '删除中...' });

  uni.request({
    url: `${BASE_URL}/teaching/lesson/delete?id=${lessonId}`,
    method: 'DELETE',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    success: (res) => {
      uni.hideLoading();
      if (res.data.code === 0) {
        uni.showToast({ title: '删除成功', icon: 'success' });
        // 刷新列表
        getLessonList();
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

const goToExamSetupForLesson = (item) => {
  const lid = resolveLessonRowId(item);
  if (!lid) {
    uni.showToast({ title: '课堂数据缺少编号', icon: 'none' });
    return;
  }
  const name = encodeURIComponent(className.value || '');
  const wid = item.weekIndex != null ? item.weekIndex : 0;
  uni.navigateTo({
    url: `/pages/exam-setup/exam-setup?lessonId=${lid}&lessonWeek=${wid}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`
  });
};

// 进入课堂（选择训练计划）或考试流程（考核选项）
const enterLesson = (item) => {
  if (forExam.value) {
    goToExamSetupForLesson(item);
    return;
  }
  const lid = resolveLessonRowId(item);
  if (!lid) {
    uni.showToast({ title: '课堂数据缺少编号', icon: 'none' });
    return;
  }
  uni.navigateTo({
    url: `/pages/training-plan-select/training-plan-select?lessonId=${lid}&courseId=${courseId.value}&lessonName=第${item.weekIndex}周&courseName=${encodeURIComponent(className.value || '')}`
  });
};

const onCardMainClick = (item) => {
  enterLesson(item);
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '--';
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

// 获取状态样式类
const getStatusClass = (status) => {
  const statusMap = {
    0: 'status-pending',
    1: 'status-active',
    2: 'status-finished'
  };
  return statusMap[status] || 'status-pending';
};

function decodeClassName(raw) {
  if (!raw) return '课堂列表';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function applyRouteOptions(options) {
  options = options || {};
  courseId.value = parseInt(options.courseId, 10) || 0;
  classId.value = parseInt(options.classId, 10) || 0;
  className.value = decodeClassName(options.className || '');
  forExam.value = options.forExam === '1' || options.forExam === 'true';

  uni.setNavigationBarTitle({
    title: className.value || '课堂列表'
  });
}

onLoad((options) => {
  applyRouteOptions(options);
  getLessonList();
});

onShow(() => {
  if (courseId.value) {
    getLessonList();
  }
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

.lesson-info {
  text-align: center;
  color: #fff;
}

.class-name {
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

/* 创建按钮区域 */
.create-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 10rpx;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;

  .icon {
    margin-right: 10rpx;
  }
}

.create-btn {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  color: #fff;
  padding: 16rpx 24rpx;
  border-radius: 30rpx;
  font-size: 26rpx;

  &:active {
    opacity: 0.9;
  }

  .create-icon {
    font-size: 32rpx;
    margin-right: 8rpx;
    font-weight: bold;
  }
}

/* 课堂卡片 */
.lesson-list {
  .lesson-card {
    background-color: #fff;
    border-radius: 20rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .card-main {
    padding: 30rpx;
  }

  .lesson-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .lesson-week {
      display: flex;
      align-items: center;

      .week-num {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-right: 16rpx;
      }

      .lesson-type {
        font-size: 24rpx;
        color: #07c160;
        background-color: #f0f9eb;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
      }
    }

    .lesson-status {
      font-size: 24rpx;
      padding: 4rpx 12rpx;
      border-radius: 12rpx;

      &.status-pending {
        color: #999;
        background-color: #f5f5f5;
      }

      &.status-active {
        color: #07c160;
        background-color: #f0f9eb;
      }

      &.status-finished {
        color: #666;
        background-color: #f0f0f0;
      }
    }
  }

  .lesson-time {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;

    .time-icon {
      margin-right: 12rpx;
      font-size: 28rpx;
    }

    .time-text {
      font-size: 28rpx;
      color: #666;
    }
  }

  .lesson-footer {
    .teacher-name {
      font-size: 26rpx;
      color: #999;
    }
  }

  /* 操作按钮 */
  .card-actions {
    display: flex;
    border-top: 1rpx solid #f5f5f5;

    .action-btn {
      flex: 1;
      padding: 24rpx 0;
      text-align: center;
      font-size: 28rpx;

      &:active {
        background-color: #f5f5f5;
      }

      &.delete {
        color: #ff4d4f;
        border-right: 1rpx solid #f5f5f5;
      }

      &.enter {
        color: #07c160;
        font-weight: 500;
      }
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  background-color: #fff;
  border-radius: 20rpx;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 32rpx;
    color: #999;
    margin-bottom: 16rpx;
  }

  .empty-tip {
    font-size: 26rpx;
    color: #bbb;
  }
}
</style>
