<template>
  <view class="page-container">
    <!-- 顶部区域 -->
    <view class="top-bg">
      <view class="class-info">
        <text class="class-name">{{ className }}</text>
        <text class="subtitle">创建新课堂</text>
      </view>
    </view>

    <!-- 创建表单 -->
    <view class="content-area">
      <view class="form-card">
        <view class="form-title">课堂信息</view>

        <!-- 周次 -->
        <view class="form-item">
          <text class="form-label">周次</text>
          <picker mode="selector" :range="weekOptions" :value="weekIndex" @change="onWeekChange">
            <view class="form-picker" :class="{ 'placeholder': weekIndex === -1 }">
              {{ weekIndex >= 0 ? weekOptions[weekIndex] : '请选择周次' }}
            </view>
          </picker>
        </view>

        <!-- 开始时间 -->
        <view class="form-item">
          <text class="form-label">开始时间</text>
          <picker mode="multiSelector" :range="dateTimeRange" :value="startTimeValue" @change="onStartTimeChange" @columnchange="onStartColumnChange">
            <view class="form-picker" :class="{ 'placeholder': !form.startTime }">
              {{ form.startTime || '请选择开始时间' }}
            </view>
          </picker>
        </view>

        <!-- 结束时间 -->
        <view class="form-item">
          <text class="form-label">结束时间</text>
          <picker mode="multiSelector" :range="dateTimeRange" :value="endTimeValue" @change="onEndTimeChange" @columnchange="onEndColumnChange">
            <view class="form-picker" :class="{ 'placeholder': !form.endTime }">
              {{ form.endTime || '请选择结束时间' }}
            </view>
          </picker>
        </view>

        <!-- 课堂类型 -->
        <view class="form-item">
          <text class="form-label">课堂类型</text>
          <picker mode="selector" :range="typeOptions" :value="typeIndex" @change="onTypeChange">
            <view class="form-picker">
              {{ typeOptions[typeIndex] }}
            </view>
          </picker>
        </view>
      </view>

      <!-- 提交按钮 -->
      <button class="submit-btn" @click="createLesson">创建课堂</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';

// 接口基础地址
const BASE_URL = "http://10.112.189.54:48080/admin-api";

// 页面参数
const courseId = ref(0);
const classId = ref(0);
const className = ref('');

// 表单数据
const form = reactive({
  weekIndex: 1,
  startTime: '',
  endTime: '',
  type: 1
});

// 选择器索引
const weekIndex = ref(-1);
const typeIndex = ref(0);
const startTimeValue = ref([0, 0, 0, 0, 0]);
const endTimeValue = ref([0, 0, 0, 0, 0]);

// 选项数据
const weekOptions = Array.from({ length: 16 }, (_, i) => `第${i + 1}周`);
const typeOptions = ['普通课堂'];

// 日期时间选择器范围
const years = Array.from({ length: 5 }, (_, i) => (2024 + i) + '年');
const months = Array.from({ length: 12 }, (_, i) => (i + 1) + '月');
const days = Array.from({ length: 31 }, (_, i) => (i + 1) + '日');
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + '时');
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0') + '分');

const dateTimeRange = [years, months, days, hours, minutes];

// 获取当前日期时间索引
const getCurrentDateTimeValue = () => {
  const now = new Date();
  return [
    now.getFullYear() - 2024,
    now.getMonth(),
    now.getDate() - 1,
    now.getHours(),
    now.getMinutes()
  ];
};

// 格式化日期时间
const formatDateTime = (value) => {
  const year = years[value[0]].replace('年', '');
  const month = (value[1] + 1).toString().padStart(2, '0');
  const day = (value[2] + 1).toString().padStart(2, '0');
  const hour = hours[value[3]].replace('时', '');
  const minute = minutes[value[4]].replace('分', '');
  return `${year}-${month}-${day} ${hour}:${minute}:00`;
};

// 周次选择
const onWeekChange = (e) => {
  weekIndex.value = e.detail.value;
  form.weekIndex = e.detail.value + 1;
};

// 类型选择
const onTypeChange = (e) => {
  typeIndex.value = e.detail.value;
  form.type = e.detail.value + 1;
};

// 开始时间选择
const onStartTimeChange = (e) => {
  startTimeValue.value = e.detail.value;
  form.startTime = formatDateTime(e.detail.value);
};

const onStartColumnChange = (e) => {
  // 可以在这里处理联动，如月份改变时更新天数
};

// 结束时间选择
const onEndTimeChange = (e) => {
  endTimeValue.value = e.detail.value;
  form.endTime = formatDateTime(e.detail.value);
};

const onEndColumnChange = (e) => {
  // 可以在这里处理联动
};

// 创建课堂
const createLesson = () => {
  if (weekIndex.value === -1) {
    uni.showToast({ title: '请选择周次', icon: 'none' });
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

  const token = uni.getStorageSync('token');

  uni.showLoading({ title: '创建中...' });

  uni.request({
    url: `${BASE_URL}/teaching/lesson/create`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': '1',
      'Content-Type': 'application/json'
    },
    data: {
      courseId: courseId.value,
      weekIndex: form.weekIndex,
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type
    },
    success: (res) => {
      uni.hideLoading();
      if (res.data.code === 0) {
        uni.showToast({ title: '创建成功', icon: 'success' });
        setTimeout(() => {
          uni.navigateBack();
        }, 500);
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

// 生命周期
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  courseId.value = parseInt(options.courseId) || 0;
  classId.value = parseInt(options.classId) || 0;
  className.value = options.className || '班级详情';

  // 设置导航栏标题
  uni.setNavigationBarTitle({
    title: '创建课堂'
  });

  // 默认选中当前时间
  const currentValue = getCurrentDateTimeValue();
  startTimeValue.value = [...currentValue];
  endTimeValue.value = [...currentValue];
});
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 顶部区域 */
.top-bg {
  height: 240rpx;
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
  margin-top: -40rpx;
}

/* 表单卡片 */
.form-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 40rpx;
  padding-left: 20rpx;
  border-left: 8rpx solid #07c160;
}

.form-item {
  margin-bottom: 40rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-picker {
  height: 90rpx;
  background-color: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
  color: #333;
  display: flex;
  align-items: center;

  &.placeholder {
    color: #999;
  }
}

/* 提交按钮 */
.submit-btn {
  margin-top: 60rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  color: #fff;
  font-size: 34rpx;
  font-weight: bold;
  border-radius: 50rpx;
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
