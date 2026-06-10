<template>
  <view class="page-container">
    <page-nav-bar title="考核识别" />
    <view class="top-card">
      <view class="info-row">
        <text class="label">班级</text>
        <text class="value">{{ className || '--' }}</text>
      </view>
      <view class="info-row">
        <text class="label">场地</text>
        <text class="value">{{ venueDisplayText }}</text>
      </view>
      <view class="info-row">
        <text class="label">学员</text>
        <text class="value">{{ studentName || '--' }}</text>
      </view>
      <view v-if="studentNo" class="info-row">
        <text class="label">学号</text>
        <text class="value">{{ studentNo }}</text>
      </view>
      <view class="info-row">
        <text class="label">考核项目</text>
        <text class="value">{{ examTypeLabel }}</text>
      </view>
    </view>

    <view class="preview-reserved">
      <text class="preview-title">预览与识别区域</text>
      <text class="preview-desc">场地视频流、落点或动作结果将在此展示（待接入）</text>
      <text v-if="lastRequestId" class="preview-request-id">任务ID：{{ lastRequestId }}</text>
      <text v-if="lastTaskStatus" class="preview-task-status">任务状态：{{ lastTaskStatus }}</text>
    </view>

    <view class="bottom-actions">
      <view class="btn-row">
        <view
          v-if="isActionRecognition"
          class="btn btn-upload-test"
          :class="{ 'btn--disabled': isRecognizing }"
          @click="onUploadAndRecognizeTest"
        >
          <text>{{ isRecognizing ? '上传中…' : '测试上传识别' }}</text>
        </view>
        <view
          class="btn btn-start"
          :class="{ 'btn--disabled': isRecognizing }"
          @click="onStartRecognize"
        >
          <text>{{ isRecognizing ? '识别中…' : '开始识别' }}</text>
        </view>
        <view class="btn btn-stop" @click="onStopRecognize">
          <text>结束识别</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { startRecognition, stopRecognition } from '../../services/examRecognition.js';

const courseId = ref(0);
const classId = ref(0);
const className = ref('');
const venueId = ref('');
const venueLineFromQuery = ref('');
const examType = ref('');
const classStudentId = ref(0);
const studentName = ref('');
const studentNo = ref('');
const userId = ref('');
const lessonId = ref(0);

const isRecognizing = ref(false);
const sessionId = ref(null);
const hasShownDevTip = ref(false);
const lastRequestId = ref('');
const lastTaskStatus = ref('');

const isActionRecognition = computed(() => examType.value === 'action_recognition');

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

function decodeParam(raw) {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const onStartRecognize = async () => {
  if (isRecognizing.value) return;
  if (isActionRecognition.value) {
    await onUploadAndRecognizeTest();
    return;
  }
  if (!venueId.value) {
    uni.showToast({ title: '缺少场地信息', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '启动中…', mask: true });
  try {
    const result = await startRecognition({
      venueId: venueId.value,
      examType: examType.value,
      courseId: courseId.value,
      classId: classId.value,
      lessonId: lessonId.value,
      classStudentId: classStudentId.value,
      userId: userId.value
    });
    sessionId.value = result.localSessionId;
    isRecognizing.value = true;
    if (!hasShownDevTip.value) {
      hasShownDevTip.value = true;
      uni.showToast({ title: '识别服务开发中', icon: 'none' });
    }
  } catch (e) {
    console.error(e);
    uni.showToast({ title: '启动失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const onUploadAndRecognizeTest = async () => {
  if (isRecognizing.value) return;
  if (!isActionRecognition.value) {
    uni.showToast({ title: '当前不是动作识别项目', icon: 'none' });
    return;
  }
  let selectedFilePath = '';
  try {
    const chooseRes = await uni.chooseVideo({
      sourceType: ['album'],
      compressed: true,
      maxDuration: 300
    });
    selectedFilePath = chooseRes?.tempFilePath || '';
  } catch (e) {
    if (e && (e.errMsg || '').includes('cancel')) return;
    uni.showToast({ title: '选择视频失败', icon: 'none' });
    return;
  }
  if (!selectedFilePath) {
    uni.showToast({ title: '未获取到视频文件', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '上传识别中…', mask: true });
  isRecognizing.value = true;
  try {
    const result = await startRecognition({
      venueId: venueId.value,
      examType: examType.value,
      courseId: courseId.value,
      classId: classId.value,
      lessonId: lessonId.value,
      classStudentId: classStudentId.value,
      userId: userId.value,
      filePath: selectedFilePath
    });
    sessionId.value = result.localSessionId;
    lastRequestId.value = result.requestId || '';
    lastTaskStatus.value = result.status || '';
    uni.showToast({ title: '已提交分析任务', icon: 'success' });
  } catch (e) {
    console.error(e);
    const msg = e?.message || '上传识别失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    isRecognizing.value = false;
    uni.hideLoading();
  }
};

const onStopRecognize = async () => {
  uni.showLoading({ title: '结束中…', mask: true });
  try {
    await stopRecognition(sessionId.value);
    sessionId.value = null;
    isRecognizing.value = false;
  } catch (e) {
    console.error(e);
    uni.showToast({ title: '结束失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

onLoad((options) => {
  options = options || {};
  courseId.value = parseInt(options.courseId, 10) || 0;
  classId.value = parseInt(options.classId, 10) || 0;
  className.value = decodeParam(options.className || '');
  venueId.value = decodeParam(options.venueId || '');
  venueLineFromQuery.value = decodeParam(options.venueLabel || '');
  examType.value = decodeParam(options.examType || '');
  classStudentId.value = parseInt(options.classStudentId, 10) || 0;
  studentName.value = decodeParam(options.studentName || '');
  studentNo.value = decodeParam(options.studentNo || '');
  userId.value =
    options.userId != null && options.userId !== '' ? String(options.userId) : '';
  lessonId.value = parseInt(options.lessonId, 10) || 0;

  uni.setNavigationBarTitle({
    title: className.value ? `${className.value} · 考核` : '考核识别'
  });

  const requiredReady =
    !!classId.value &&
    !!courseId.value &&
    !!lessonId.value &&
    !!venueId.value &&
    !!examType.value &&
    !!classStudentId.value;
  if (!requiredReady) {
    uni.showToast({ title: '参数不完整，请返回重试', icon: 'none' });
    return;
  }
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom));
}

.top-card {
  margin: 24rpx 30rpx 0;
  padding: 28rpx 30rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  width: 140rpx;
  flex-shrink: 0;
  font-size: 26rpx;
  color: #999;
}

.value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
}

.preview-reserved {
  flex: 1;
  min-height: 420rpx;
  margin: 24rpx 30rpx;
  padding: 40rpx 32rpx;
  background: #fafbfc;
  border: 2rpx dashed #d0d5dd;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.preview-title {
  font-size: 30rpx;
  color: #666;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.preview-desc {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  line-height: 1.6;
}

.preview-request-id,
.preview-task-status {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #666;
  text-align: center;
  word-break: break-all;
}

.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 30rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent, #f5f7fa 28%);
}

.btn-row {
  display: flex;
  gap: 20rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: bold;
  box-sizing: border-box;

  text {
    color: inherit;
  }

  &:active {
    opacity: 0.92;
  }
}

.btn-start {
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  color: #fff;
}

.btn-stop {
  background: #fff;
  color: #07c160;
  border: 2rpx solid #07c160;
}

.btn-upload-test {
  background: linear-gradient(135deg, #ff9f0a, #ff6a00);
  color: #fff;
}

.btn--disabled {
  opacity: 0.45;
  pointer-events: none;
}
</style>
