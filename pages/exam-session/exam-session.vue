<template>
  <view class="page-container">
    <page-nav-bar title="考核进行中" />
    <view class="top-bg">
      <view class="info">
        <text class="subtitle">{{ headerSubtitle }}</text>
      </view>
    </view>

    <view class="content-area">
      <view v-if="!optionsParsed" class="hint">加载中...</view>

      <view v-else-if="!classId" class="empty-state">
        <text class="empty-icon">⚠️</text>
        <text class="empty-text">缺少班级信息</text>
        <text class="empty-tip">请从班级详情重新进入考试</text>
      </view>

      <view v-else-if="loading" class="hint">加载中...</view>

      <view v-else-if="studentList.length > 0" class="student-list">
        <view
          v-for="s in studentList"
          :key="s.id"
          class="student-card"
          :class="{ selected: selectedClassStudentId === s.id }"
          @click="selectStudent(s)"
        >
          <view class="row-main">
            <text class="name">{{ s.studentName || '未命名' }}</text>
            <text v-if="selectedClassStudentId === s.id" class="check">已选</text>
          </view>
          <view class="row-meta">
            <text v-if="s.studentNo" class="meta">学号 {{ s.studentNo }}</text>
            <text v-if="s.gender" class="meta">{{ s.gender }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无学员</text>
        <text class="empty-tip">请先在班级中添加学员</text>
      </view>

      <view class="bottom-actions">
        <view
          class="confirm-btn"
          :class="{ 'confirm-btn--disabled': selectedClassStudentId === null }"
          @click="onStartExam"
        >
          <text>{{ selectedClassStudentId !== null ? '开始考核' : '请先选择一名学员' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const BASE_URL = 'http://10.112.189.54:48080/admin-api';

const courseId = ref(0);
const classId = ref(0);
const className = ref('');
const venueId = ref('');
const venueLineFromQuery = ref('');
const examType = ref('');
const lessonId = ref(0);

const studentList = ref([]);
const loading = ref(false);
const optionsParsed = ref(false);
const selectedClassStudentId = ref(null);
const selectedUserId = ref(null);

const examTypeLabel = computed(() => {
  if (examType.value === 'landing') return '落点检测';
  if (examType.value === 'action_recognition') return '动作识别';
  return examType.value || '--';
});

const venueDisplayText = computed(() => {
  if (venueLineFromQuery.value) return venueLineFromQuery.value;
  const n = venueId.value;
  return n ? `${n}号场地` : '--';
});

const headerSubtitle = computed(() => {
  const cn = className.value || '班级';
  return `${cn} · ${venueDisplayText.value} · ${examTypeLabel.value}`;
});

function decodeParam(raw) {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const getToken = () => uni.getStorageSync('token') || '';

const fetchClassStudents = (cid) => {
  if (!cid) {
    loading.value = false;
    studentList.value = [];
    uni.showToast({ title: '班级ID无效', icon: 'none' });
    return;
  }
  loading.value = true;
  const token = getToken();
  uni.request({
    url: `${BASE_URL}/teaching/class-student/list-by-class`,
    method: 'GET',
    header: {
      Authorization: `Bearer ${token}`,
      'Tenant-Id': '1'
    },
    data: { classId: cid },
    success: (res) => {
      loading.value = false;
      if (res.data && res.data.code === 0) {
        studentList.value = res.data.data || [];
      } else {
        studentList.value = [];
        uni.showToast({ title: (res.data && res.data.msg) || '获取学员失败', icon: 'none' });
      }
    },
    fail: (err) => {
      loading.value = false;
      console.error(err);
      uni.showToast({ title: '网络连接异常', icon: 'none' });
    }
  });
};

const selectStudent = (s) => {
  selectedClassStudentId.value = s.id;
  selectedUserId.value = s.userId;
};

const onStartExam = () => {
  if (!courseId.value) {
    uni.showToast({ title: '缺少课程信息，请返回重试', icon: 'none' });
    return;
  }
  if (!classId.value) {
    uni.showToast({ title: '缺少班级信息，请返回重试', icon: 'none' });
    return;
  }
  if (!lessonId.value) {
    uni.showToast({ title: '缺少课次信息，请返回重试', icon: 'none' });
    return;
  }
  if (!venueId.value) {
    uni.showToast({ title: '缺少场地信息，请返回重试', icon: 'none' });
    return;
  }
  if (!examType.value) {
    uni.showToast({ title: '缺少考核类型，请返回重试', icon: 'none' });
    return;
  }
  if (selectedClassStudentId.value === null) {
    uni.showToast({ title: '请选择一名学员', icon: 'none' });
    return;
  }
  const s = studentList.value.find((x) => x.id === selectedClassStudentId.value);
  const name = s?.studentName || '';
  const no = s?.studentNo || '';
  const uid =
    selectedUserId.value != null && selectedUserId.value !== ''
      ? String(selectedUserId.value)
      : '';
  const q = [
    `courseId=${courseId.value}`,
    `classId=${classId.value}`,
    `className=${encodeURIComponent(className.value || '')}`,
    `lessonId=${lessonId.value}`,
    `venueId=${encodeURIComponent(venueId.value || '')}`,
    `venueLabel=${encodeURIComponent(venueLineFromQuery.value || '')}`,
    `examType=${encodeURIComponent(examType.value || '')}`,
    `classStudentId=${selectedClassStudentId.value}`,
    `studentName=${encodeURIComponent(name)}`,
    `studentNo=${encodeURIComponent(no || '')}`,
    `userId=${encodeURIComponent(uid)}`
  ].join('&');
  uni.navigateTo({
    url: `/pages/exam-active/exam-active?${q}`
  });
};

onLoad((options) => {
  options = options || {};

  courseId.value = parseInt(options.courseId, 10) || 0;
  let cid = parseInt(options.classId, 10);
  if (!cid && options.class_id != null && options.class_id !== '') {
    cid = parseInt(options.class_id, 10) || 0;
  }
  classId.value = cid || 0;

  className.value = decodeParam(options.className || '');
  venueId.value = decodeParam(options.venueId || '');
  venueLineFromQuery.value = decodeParam(options.venueLabel || '');
  examType.value = decodeParam(options.examType || '');
  lessonId.value = parseInt(options.lessonId, 10) || 0;

  uni.setNavigationBarTitle({
    title: className.value ? `${className.value} · 考试` : '考核进行中'
  });

  selectedClassStudentId.value = null;
  selectedUserId.value = null;
  optionsParsed.value = true;

  if (!classId.value) {
    loading.value = false;
    studentList.value = [];
    return;
  }
  fetchClassStudents(classId.value);
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.top-bg {
  min-height: 0;
  height: auto;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 16rpx 30rpx 28rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  text-align: center;
  color: #fff;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 22rpx;
  opacity: 0.95;
  line-height: 1.5;
}

.content-area {
  padding: 30rpx;
  margin-top: -40rpx;
  padding-bottom: 160rpx;
}

.hint {
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 40rpx;
}

.student-list {
  display: flex;
  flex-direction: column;
}

.student-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 28rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  border: 2rpx solid transparent;

  &:last-child {
    margin-bottom: 0;
  }

  &:active {
    opacity: 0.92;
  }

  &.selected {
    border-color: #07c160;
    background-color: #f0fff4;
  }
}

.row-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.check {
  font-size: 24rpx;
  color: #07c160;
  font-weight: bold;
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
}

.meta {
  font-size: 24rpx;
  color: #999;
  margin-right: 16rpx;
  margin-bottom: 4rpx;
}

.empty-state {
  padding: 80rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #999;
}

.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 30rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, #f5f7fa 30%);
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  box-sizing: border-box;

  text {
    color: #fff;
  }

  &--disabled {
    opacity: 0.45;
    background: #ccc;
  }
}
</style>
