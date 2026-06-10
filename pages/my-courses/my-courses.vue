<template>
  <view class="page-container">
    <page-nav-bar title="我的课程" :show-back="false" />

    <!-- 课程列表 -->
    <view class="content-area">
      <view v-if="courseList.length > 0" class="course-list">
        <view
          v-for="item in courseList"
          :key="item.id"
          class="course-card"
          @click="goToCourseDetail(item)"
        >
          <view class="course-main">
            <text class="course-name">{{ item.name }}</text>
            <text class="class-count">{{ item.classCount || 0 }} 个班级</text>
          </view>
          <view class="course-meta">
            <text class="meta-item">{{ item.semester || '--' }}</text>
          </view>
          <view class="course-arrow">
            <text class="arrow-icon">></text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无课程</text>
        <text class="empty-subtitle">点击下方按钮创建课程</text>
      </view>
    </view>

    <!-- 创建课程按钮 -->
    <view class="fab-btn" @click="showCreateModal">
      <text class="fab-icon">+</text>
    </view>

    <!-- 创建课程弹窗 -->
    <view v-if="showModal" class="modal-mask" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">创建课程</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>

        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">课程名称</text>
            <input
              class="form-input"
              v-model="form.name"
              placeholder="如：羽毛球"
            />
          </view>

          <view class="form-item">
            <text class="form-label">班级名称</text>
            <input
              class="form-input"
              v-model="form.courseClass"
              placeholder="如：2024211101"
            />
          </view>

          <view class="form-item">
            <text class="form-label">学期</text>
            <picker mode="selector" :range="semesterOptions" @change="onSemesterChange">
              <view class="form-picker" :class="{ 'placeholder': !form.semester }">
                {{ form.semester || '请选择学期' }}
              </view>
            </picker>
          </view>

          <view class="form-item">
            <text class="form-label">开始时间</text>
            <picker mode="multiSelector" :range="timeRange" :value="startTimeIndex" @change="onStartTimeChange">
              <view class="form-picker" :class="{ 'placeholder': !form.startTime }">
                {{ form.startTime ? formatTimeDisplay(startTimeIndex) : '请选择开始时间' }}
              </view>
            </picker>
          </view>

          <view class="form-item">
            <text class="form-label">结束时间</text>
            <picker mode="multiSelector" :range="timeRange" :value="endTimeIndex" @change="onEndTimeChange">
              <view class="form-picker" :class="{ 'placeholder': !form.endTime }">
                {{ form.endTime ? formatTimeDisplay(endTimeIndex) : '请选择结束时间' }}
              </view>
            </picker>
          </view>
        </view>

        <view class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-confirm" @click="createCourse">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ensureTeacherSession } from '../../services/userProfile.js';
import { getTeacherIdFromStorage } from '../../services/trainingPlanApi.js';
import { reactive, ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 接口基础地址
const BASE_URL = "http://10.112.189.54:48080/admin-api";

// 数据定义
const courseList = reactive([]);
const showModal = ref(false);
const semesterOptions = ['2024-2025学年第一学期', '2024-2025学年第二学期', '2025-2026学年第一学期'];

// 时间选择器数据（周几 + 时 + 分）
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + '时');
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0') + '分');

const timeRange = [weekDays, hours, minutes];
const startTimeIndex = ref([0, 8, 0]); // 默认周一 8:00
const endTimeIndex = ref([0, 9, 30]); // 默认周一 9:30

// 表单数据
const form = reactive({
  name: '',
  courseClass: '',
  semester: '',
  startTime: '',
  endTime: ''
});

// 格式化时间显示（周几 时:分）
const formatTimeDisplay = (value) => {
  const weekDay = weekDays[value[0]];
  const hour = hours[value[1]].replace('时', '');
  const minute = minutes[value[2]].replace('分', '');
  return `${weekDay} ${hour}:${minute}`;
};

// 把时间值转换为具体日期（基于当前日期计算）
const convertToDateTime = (value) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const currentDay = now.getDay(); // 0=周日, 1=周一...

  // 将周日(0)转为7，方便计算
  const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;

  // 目标星期几（1-7，周一到周日）
  const targetDay = value[0] + 1;

  // 计算差值（天数）
  let diff = targetDay - adjustedCurrentDay;

  // 如果已经过了本周的目标时间，默认选下周
  if (diff < 0) {
    diff += 7;
  }

  // 计算目标日期
  const targetDate = new Date(currentYear, currentMonth, currentDate + diff);

  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  const hour = hours[value[1]].replace('时', '');
  const minute = minutes[value[2]].replace('分', '');

  return `${year}-${month}-${day} ${hour}:${minute}:00`;
};

// 获取课程列表
const getCourseList = async () => {
  let teacherId;
  let token;
  try {
    ({ teacherId, token } = await ensureTeacherSession());
  } catch (err) {
    uni.showToast({ title: err?.message || '请先登录', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '加载中...' });

  uni.request({
    url: `${BASE_URL}/teaching/course/list-by-teacher`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    data: { teacherId },
    success: (res) => {
      uni.hideLoading();
      if (res.data.code === 0 && res.data.data) {
        courseList.length = 0;
        // 为每个课程获取班级数量
        const courses = res.data.data;
        if (courses.length === 0) return;

        courses.forEach(course => {
          courseList.push({
            ...course,
            classCount: 0 // 稍后获取
          });
          // 获取班级数量
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
                const idx = courseList.findIndex(c => c.id === course.id);
                if (idx !== -1) {
                  courseList[idx].classCount = classRes.data.data.length;
                }
              }
            }
          });
        });
      } else {
        uni.showToast({ title: res.data.msg || '获取课程失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('请求失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

// 显示创建弹窗
const showCreateModal = () => {
  form.name = '';
  form.courseClass = '';
  form.semester = '';
  form.startTime = '';
  form.endTime = '';
  // 默认设置为周一 8:00 - 9:30
  startTimeIndex.value = [0, 8, 0];
  endTimeIndex.value = [0, 9, 30];
  showModal.value = true;
};

// 关闭弹窗
const closeModal = () => {
  showModal.value = false;
};

// 学期选择
const onSemesterChange = (e) => {
  form.semester = semesterOptions[e.detail.value];
};

// 开始时间选择
const onStartTimeChange = (e) => {
  startTimeIndex.value = e.detail.value;
  form.startTime = convertToDateTime(e.detail.value);
};

// 结束时间选择
const onEndTimeChange = (e) => {
  endTimeIndex.value = e.detail.value;
  form.endTime = convertToDateTime(e.detail.value);
};

// 创建课程
const createCourse = () => {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入课程名称', icon: 'none' });
    return;
  }
  if (!form.courseClass.trim()) {
    uni.showToast({ title: '请输入班级名称', icon: 'none' });
    return;
  }
  if (!form.semester) {
    uni.showToast({ title: '请选择学期', icon: 'none' });
    return;
  }
  if (!form.startTime) {
    uni.showToast({ title: '请选择开始时间', icon: 'none' });
    return;
  }
  if (!form.endTime) {
    uni.showToast({ title: '请选择结束时间', icon: 'none' });
    return;
  }

  const teacherId = getTeacherIdFromStorage();
  const token = uni.getStorageSync('token');
  if (!teacherId || !token) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  // 组合课程时间显示
  const courseTime = `${form.startTime} 至 ${form.endTime}`;

  uni.showLoading({ title: '创建中...' });

  uni.request({
    url: `${BASE_URL}/teaching/course/create`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1',
      'Content-Type': 'application/json'
    },
    data: {
      teacherId,
      name: form.name,
      courseClass: form.courseClass,
      semester: form.semester,
      courseTime: courseTime
    },
    success: (res) => {
      uni.hideLoading();
      if (res.data.code === 0) {
        uni.showToast({ title: '创建成功', icon: 'success' });
        closeModal();
        getCourseList();
      } else {
        uni.showToast({ title: res.data.msg || '创建失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('创建失败:', err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

// 跳转到课程详情
const goToCourseDetail = (course) => {
  uni.navigateTo({
    url: `/pages/course-detail/course-detail?courseId=${course.id}`
  });
};

// 生命周期
onShow(() => {
  getCourseList();
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部栏 */
.header-bar {
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}

/* 内容区域 */
.content-area {
  padding: 30rpx;
}

/* 课程卡片 */
.course-list {
  .course-card {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    position: relative;
    display: flex;
    flex-direction: column;

    &:active {
      opacity: 0.9;
    }
  }

  .course-main {
    display: flex;
    align-items: baseline;
    margin-bottom: 12rpx;

    .course-name {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-right: 20rpx;
    }

    .class-count {
      font-size: 24rpx;
      color: #999;
    }
  }

  .course-meta {
    .meta-item {
      font-size: 26rpx;
      color: #666;
    }
  }

  .course-arrow {
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
  padding: 150rpx 40rpx;

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
  }
}

/* 创建按钮 */
.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 160rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(7, 193, 96, 0.4);

  &:active {
    opacity: 0.9;
    transform: scale(0.95);
  }

  .fab-icon {
    font-size: 48rpx;
    color: #fff;
    font-weight: bold;
  }
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: #fff;
  border-radius: 20rpx;
  width: 80%;
  max-width: 600rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .modal-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #333;
  }

  .modal-close {
    font-size: 48rpx;
    color: #999;
    line-height: 1;
  }
}

.modal-body {
  padding: 30rpx;

  .form-item {
    margin-bottom: 30rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 16rpx;
    }

    .form-input {
      height: 80rpx;
      background-color: #f5f7fa;
      border-radius: 10rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
      color: #333;
    }

    .form-picker {
      height: 80rpx;
      background-color: #f5f7fa;
      border-radius: 10rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
      color: #333;
      display: flex;
      align-items: center;

      &.placeholder {
        color: #999;
      }
    }
  }
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 40rpx;
  gap: 20rpx;

  button {
    flex: 1;
    height: 80rpx;
    border-radius: 10rpx;
    font-size: 30rpx;
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

  .btn-cancel {
    background-color: #f5f5f5;
    color: #666;
  }

  .btn-confirm {
    background: linear-gradient(135deg, #07c160, #0ebf8c);
    color: #fff;
  }
}
</style>
