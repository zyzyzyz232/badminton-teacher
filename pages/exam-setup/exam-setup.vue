<template>
  <view class="page-container">
    <view class="top-bg">
      <view class="info">
        <text class="title">考核选项</text>
        <text class="subtitle">{{ headerLine }}</text>
      </view>
    </view>

    <view class="content-area">
      <view class="section">
        <view class="section-title">
          <view class="section-bar"></view>
          <text>选择场地</text>
        </view>
        <picker
          class="venue-picker-wrap"
          mode="selector"
          :range="venueList"
          range-key="line"
          :value="venuePickerIndex"
          @change="onVenueChange"
        >
          <view class="venue-picker">
            <view class="venue-picker-inner">
              <text class="venue-picker-label">当前场地</text>
              <text class="venue-picker-value">{{ venueDisplayLine }}</text>
            </view>
            <text class="venue-picker-arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="section">
        <view class="section-title">
          <view class="section-bar"></view>
          <text>考核项目</text>
        </view>
        <view class="exam-type-list">
          <view
            v-for="t in examTypes"
            :key="t.id"
            class="exam-type-card"
            :class="{ selected: selectedExamType === t.id }"
            @click="selectedExamType = t.id"
          >
            <text class="exam-type-title">{{ t.title }}</text>
            <text class="exam-type-desc">{{ t.desc }}</text>
          </view>
        </view>
      </view>

      <view class="bottom-actions">
        <view
          class="confirm-btn"
          :class="{ 'confirm-btn--disabled': !canStart }"
          @click="goToExamSession"
        >
          <text>{{ confirmBtnLabel }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const venueList = ref([
  { id: '1', name: '1号场地', location: '体育馆A区', line: '1号场地 · 体育馆A区' },
  { id: '2', name: '2号场地', location: '体育馆A区', line: '2号场地 · 体育馆A区' },
  { id: '3', name: '3号场地', location: '体育馆A区', line: '3号场地 · 体育馆A区' },
  { id: '4', name: '4号场地', location: '体育馆B区', line: '4号场地 · 体育馆B区' },
  { id: '5', name: '5号场地', location: '体育馆B区', line: '5号场地 · 体育馆B区' },
  { id: '6', name: '6号场地', location: '体育馆B区', line: '6号场地 · 体育馆B区' },
  { id: '7', name: '7号场地', location: '训练馆', line: '7号场地 · 训练馆' },
  { id: '8', name: '8号场地', location: '训练馆', line: '8号场地 · 训练馆' },
  { id: '9', name: '9号场地', location: '训练馆', line: '9号场地 · 训练馆' }
]);

const examTypes = [
  { id: 'landing', title: '落点检测', desc: '羽毛球落点智能检测' },
  { id: 'action_recognition', title: '动作识别', desc: '技术动作识别与评测' }
];

const courseId = ref(0);
const classId = ref(0);
const className = ref('');
const lessonId = ref(0);
const lessonWeek = ref(0);
const venuePickerIndex = ref(0);
const selectedVenueId = ref(venueList.value[0].id);
const selectedExamType = ref('');

const displayClassName = computed(() => className.value || '班级');

const headerLine = computed(() => {
  const base = displayClassName.value;
  if (lessonWeek.value > 0) return `${base} · 第${lessonWeek.value}周`;
  return base;
});

const venueDisplayLine = computed(() => {
  const list = venueList.value;
  const v = list[venuePickerIndex.value];
  return v ? v.line : '';
});

const canStart = computed(
  () => !!lessonId.value && !!selectedVenueId.value && !!selectedExamType.value
);

const confirmBtnLabel = computed(() => {
  if (!lessonId.value) return '请从课堂列表选择课堂';
  if (!selectedExamType.value) return '请选择考核项目';
  return canStart.value ? '开始考试' : '请选择考核项目';
});

const onVenueChange = (e) => {
  const idx = parseInt(e.detail.value, 10);
  const list = venueList.value;
  if (Number.isNaN(idx) || idx < 0 || idx >= list.length) return;
  venuePickerIndex.value = idx;
  selectedVenueId.value = list[idx].id;
};

function decodeClassName(raw) {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const goToExamSession = () => {
  if (!courseId.value) {
    uni.showToast({ title: '缺少课程信息，请返回重试', icon: 'none' });
    return;
  }
  if (!classId.value) {
    uni.showToast({ title: '缺少班级信息，请返回班级详情重试', icon: 'none' });
    return;
  }
  if (!lessonId.value) {
    uni.showToast({ title: '缺少课堂，请从课堂列表进入考试', icon: 'none' });
    return;
  }
  if (!canStart.value) {
    uni.showToast({ title: '请先选择考核项目', icon: 'none' });
    return;
  }

  const q = [
    `courseId=${courseId.value}`,
    `classId=${classId.value}`,
    `className=${encodeURIComponent(className.value)}`,
    `lessonId=${lessonId.value}`,
    `venueId=${encodeURIComponent(selectedVenueId.value)}`,
    `venueLabel=${encodeURIComponent(venueDisplayLine.value || '')}`,
    `examType=${encodeURIComponent(selectedExamType.value)}`
  ].join('&');
  uni.navigateTo({
    url: `/pages/exam-session/exam-session?${q}`
  });
};

function pickQuery(options, ...keys) {
  for (const k of keys) {
    const v = options[k];
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) return v[0];
    return v;
  }
  return '';
}

onLoad((options) => {
  options = options || {};
  courseId.value = parseInt(String(pickQuery(options, 'courseId') || ''), 10) || 0;
  classId.value = parseInt(String(pickQuery(options, 'classId', 'class_id') || ''), 10) || 0;
  className.value = decodeClassName(pickQuery(options, 'className', 'class_name') || '');
  const rawLid = pickQuery(options, 'lessonId', 'lesson_id');
  lessonId.value = parseInt(String(rawLid || ''), 10) || 0;
  const rawWeek = pickQuery(options, 'lessonWeek', 'lesson_week');
  lessonWeek.value = parseInt(String(rawWeek || ''), 10) || 0;

  uni.setNavigationBarTitle({ title: '考核选项' });
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.top-bg {
  height: 220rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 40rpx;
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
  font-size: 26rpx;
  opacity: 0.9;
}

.content-area {
  padding: 30rpx;
  margin-top: -30rpx;
  padding-bottom: 160rpx;
}

.section {
  margin-bottom: 36rpx;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.section-bar {
  width: 8rpx;
  height: 28rpx;
  background: #07c160;
  border-radius: 4rpx;
  margin-right: 16rpx;
}

.venue-picker-wrap {
  width: 100%;
  display: block;
}

.venue-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  border: 2rpx solid #e8e8e8;
}

.venue-picker:active {
  opacity: 0.92;
}

.venue-picker-inner {
  flex: 1;
  min-width: 0;
}

.venue-picker-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.venue-picker-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.venue-picker-arrow {
  font-size: 24rpx;
  color: #07c160;
  margin-left: 20rpx;
  flex-shrink: 0;
}

.exam-type-list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.exam-type-card {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  min-height: 140rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  border: 3rpx solid transparent;
  box-sizing: border-box;

  &:active {
    opacity: 0.92;
  }

  &.selected {
    border-color: #07c160;
    background-color: #f0fff4;
  }
}

.exam-type-title {
  font-size: 38rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.exam-type-desc {
  font-size: 28rpx;
  color: #888;
  line-height: 1.5;
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
