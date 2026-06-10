<template>
  <view class="page-container">
    <page-nav-bar title="羽毛球教学" :show-back="false" />
    <!-- 顶部欢迎区（简洁） -->
    <view class="welcome-bar">
      <text class="welcome-text">欢迎回来，{{ teacherName }}</text>
    </view>

    <!-- 课程和班级列表 -->
    <view class="content-area">
      <view class="section-header">
        <text class="section-title">选择班级上课</text>
        <text class="section-subtitle">共 {{ totalClasses }} 个班级</text>
      </view>

      <!-- 按课程分组的班级列表 -->
      <view v-if="courseGroups.length > 0" class="course-groups">
        <view
          v-for="course in courseGroups"
          :key="course.courseId"
          class="course-section"
        >
          <!-- 课程标题（大字） -->
          <view class="course-header-bar">
            <text class="course-title">{{ course.courseName }}</text>
            <text class="course-class-tag">{{ course.courseClass }}</text>
          </view>

          <!-- 该课程下的班级列表 -->
          <view class="class-list">
            <view
              v-for="cls in course.classes"
              :key="cls.classId ?? cls.id"
              class="class-card"
              @click="goToClassDetail(cls)"
            >
              <view class="class-header">
                <text class="class-name">{{ cls.className }}</text>
                <text class="student-count">{{ cls.studentCount || 0 }} 人</text>
              </view>
              <view class="class-info">
                <view class="info-row">
                  <text class="info-label">学期：</text>
                  <text class="info-value">{{ course.semester || '--' }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">时间：</text>
                  <text class="info-value">{{ course.courseTime || '--' }}</text>
                </view>
              </view>
              <view class="class-arrow">
                <text class="arrow-icon">></text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 - 需要创建课程 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📚</text>
        <text class="empty-text">还没有班级</text>
        <text class="empty-subtitle">请先创建课程并添加班级</text>
        <view class="action-btns">
          <button class="create-btn" @click="goToMyCourses">去创建课程</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { ensureTeacherSession } from '../../services/userProfile.js';
import { getTeacherNameFromStorage } from '../../services/trainingPlanApi.js';

// 接口基础地址
const BASE_URL = "http://10.112.189.54:48080/admin-api";

// 数据定义
const teacherName = ref('');
const courseGroups = reactive([]);

// 计算总班级数
const totalClasses = computed(() => {
  return courseGroups.reduce((total, course) => total + course.classes.length, 0);
});

// 按课程分组获取班级列表
const getClassList = (teacherId, token) => {
  teacherName.value = getTeacherNameFromStorage() || '老师';
  uni.showLoading({ title: '加载中...' });

  // 先获取课程列表
  uni.request({
    url: `${BASE_URL}/teaching/course/list-by-teacher`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    data: { teacherId },
    success: (res) => {
      if (res.data.code === 0 && res.data.data) {
        const courses = res.data.data;
        courseGroups.length = 0;

        if (courses.length === 0) {
          uni.hideLoading();
          return;
        }

        let completedRequests = 0;

        // 对每个课程获取班级
        courses.forEach(course => {
          uni.request({
            url: `${BASE_URL}/teaching/course/list-classes`,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'Tenant-Id': '1'
            },
            data: { courseId: course.id },
            success: (classRes) => {
              if (classRes.data.code === 0 && classRes.data.data) {
                const classes = classRes.data.data.map(cls => ({
                  ...cls,
                  courseId: course.id,
                  id: cls.classId != null ? cls.classId : cls.id
                }));

                // 添加到分组
                if (classes.length > 0) {
                  courseGroups.push({
                    courseId: course.id,
                    courseName: course.name,
                    courseClass: course.courseClass,
                    semester: course.semester,
                    courseTime: course.courseTime,
                    classes: classes
                  });
                }
              }
            },
            complete: () => {
              completedRequests++;
              if (completedRequests === courses.length) {
                uni.hideLoading();
                // 按课程ID排序
                courseGroups.sort((a, b) => a.courseId - b.courseId);
              }
            }
          });
        });
      } else {
        uni.hideLoading();
        uni.showToast({ title: res.data.msg || '获取数据失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('请求失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

// 跳转到班级详情
const goToClassDetail = (cls) => {
  const cid = cls.classId != null ? cls.classId : cls.id;
  uni.navigateTo({
    url: `/pages/class-detail/class-detail?courseId=${cls.courseId}&classId=${cid}&className=${encodeURIComponent(cls.className || '')}`
  });
};

// 跳转到我的课程Tab
const goToMyCourses = () => {
  uni.switchTab({
    url: '/pages/my-courses/my-courses'
  });
};

const loadPage = async () => {
  try {
    const { teacherId, token } = await ensureTeacherSession();
    getClassList(teacherId, token);
  } catch (err) {
    console.error(err);
    uni.showToast({ title: err?.message || '请先登录', icon: 'none' });
  }
};

onShow(() => {
  loadPage();
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 简洁的欢迎栏 */
.welcome-bar {
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 30rpx 40rpx;
  display: flex;
  align-items: center;
}

.welcome-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
}

/* 内容区域 */
.content-area {
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }

  .section-subtitle {
    font-size: 26rpx;
    color: #999;
  }
}

/* 课程分组 */
.course-groups {
  .course-section {
    margin-bottom: 30rpx;
  }

  .course-header-bar {
    background: linear-gradient(135deg, #07c160, #0ebf8c);
    padding: 24rpx 30rpx;
    border-radius: 16rpx 16rpx 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .course-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #fff;
    }

    .course-class-tag {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.9);
      background-color: rgba(255, 255, 255, 0.2);
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
    }
  }
}

/* 班级卡片 */
.class-list {
  .class-card {
    background-color: #fff;
    border-radius: 0 0 16rpx 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    position: relative;

    &:active {
      opacity: 0.9;
    }
  }

  .class-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .class-name {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
    }

    .student-count {
      font-size: 24rpx;
      color: #07c160;
      background-color: #f0f9eb;
      padding: 4rpx 12rpx;
      border-radius: 16rpx;
    }
  }

  .class-info {
    .info-row {
      display: flex;
      margin-bottom: 8rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-size: 26rpx;
        color: #999;
        width: 100rpx;
      }

      .info-value {
        font-size: 26rpx;
        color: #666;
        flex: 1;
      }
    }
  }

  .class-arrow {
    position: absolute;
    right: 30rpx;
    top: 50%;
    transform: translateY(-50%);

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
  padding: 120rpx 40rpx;

  .empty-icon {
    font-size: 100rpx;
    margin-bottom: 30rpx;
  }

  .empty-text {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
  }

  .empty-subtitle {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 50rpx;
  }

  .action-btns {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .create-btn {
    background: linear-gradient(135deg, #07c160, #0ebf8c);
    color: #fff;
    font-size: 32rpx;
    padding: 28rpx 0;
    border-radius: 12rpx;
    border: none;
    width: 80%;

    &:active {
      opacity: 0.9;
    }

    &::after {
      display: none;
    }
  }
}
</style>
