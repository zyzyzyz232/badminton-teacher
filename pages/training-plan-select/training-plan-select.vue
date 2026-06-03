<template>
  <view class="page-container">
    <!-- 顶部区域 -->
    <view class="top-bg">
      <view class="info">
        <text class="title">选择训练计划</text>
        <text class="subtitle">{{ courseName }} - {{ lessonName }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content-area">
      <!-- 教学计划列表 -->
      <view v-if="planList.length > 0" class="plan-list">
        <view
          v-for="plan in planList"
          :key="plan.id"
          class="plan-card"
          :class="{ selected: selectedPlanId === plan.id }"
          @click="selectPlan(plan)"
        >
          <view class="plan-header">
            <text class="plan-title">{{ plan.planTitle }}</text>
            <view class="plan-tags">
              <text class="tag type" :class="'type-' + plan.planType">{{ plan.planTypeText }}</text>
              <text class="tag difficulty" :class="'difficulty-' + plan.difficulty">{{ plan.difficultyText }}</text>
            </view>
          </view>

          <view class="plan-meta">
            <text class="meta-item">
              <text class="label">时长：</text>
              <text class="value">{{ plan.duration }}分钟</text>
            </text>
            <text class="meta-item">
              <text class="label">状态：</text>
              <text class="value" :class="'status-' + plan.status">{{ plan.statusText }}</text>
            </text>
          </view>

          <view v-if="plan.planContent" class="plan-content">
            <text>{{ plan.planContent }}</text>
          </view>

          <view class="plan-card-footer" @click.stop>
            <button class="btn-edit-plan" @click="goEditPlan(plan)">编辑训练计划</button>
          </view>

          <!-- 展开显示训练项目 -->
          <view v-if="selectedPlanId === plan.id && planProjects[plan.id]" class="project-section">
            <view class="section-title">训练项目</view>
            <view
              v-for="project in planProjects[plan.id]"
              :key="project.id"
              class="project-item"
            >
              <view class="project-header">
                <text class="project-name">{{ project.itemName }}</text>
                <text class="project-type" :class="'item-type-' + project.itemType">
                  {{ getItemTypeText(project.itemType) }}
                </text>
              </view>
              <view class="project-meta">
                <text>{{ project.duration }}分钟</text>
                <text>满分{{ project.score }}分</text>
                <text :class="'difficulty-' + project.difficulty">{{ getDifficultyText(project.difficulty) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无训练计划</text>
        <text class="empty-tip">请先在「训练计划」中新建，再回到本课堂选择</text>
      </view>

      <!-- 底部按钮 -->
      <view class="bottom-actions" v-if="planList.length > 0">
        <button class="confirm-btn" :disabled="!selectedPlanId" @click="confirmPlan">
          {{ selectedPlanId ? '确认并开始训练' : '请选择训练计划' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  fetchPlanListByTeacher,
  fetchPlanProjectsByPlan,
  bindPlanToCurrentLesson,
  getTeacherIdFromStorage,
} from '../../services/trainingPlanApi.js';

// 页面参数
const lessonId = ref(0);
const courseId = ref(0);
const lessonName = ref('');
const courseName = ref('');

// 数据
const planList = ref([]);
const planProjects = ref({});
const selectedPlanId = ref(null);
const loading = ref(false);

// 当前教师名下全部训练计划（进入课堂后再绑定本课）
const fetchPlanList = async () => {
  const tid = getTeacherIdFromStorage();
  if (!tid) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  if (!lessonId.value) {
    uni.showToast({ title: '课堂ID无效', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const list = await fetchPlanListByTeacher(tid);
    planList.value = list || [];
  } catch (err) {
    console.error('请求失败:', err);
    planList.value = [];
    uni.showToast({
      title: (err && err.message) || '获取训练计划列表失败',
      icon: 'none',
      duration: 2500,
    });
  } finally {
    loading.value = false;
  }
};

// 获取训练项目列表
const fetchPlanProjects = (planId) => {
  if (planProjects.value[planId]) return;

  fetchPlanProjectsByPlan(planId)
    .then((list) => {
      planProjects.value[planId] = list || [];
    })
    .catch((err) => {
      console.error('获取训练项目失败:', err);
      planProjects.value[planId] = [];
    });
};

// 跳转训练计划安排页
const goEditPlan = (plan) => {
  if (!plan || plan.id == null) return;
  const q = [
    `planId=${encodeURIComponent(plan.id)}`,
    `lessonId=${encodeURIComponent(lessonId.value)}`,
    `lessonName=${encodeURIComponent(lessonName.value || '')}`,
    `courseName=${encodeURIComponent(courseName.value || '')}`,
  ].join('&');
  uni.navigateTo({
    url: `/pages/training-plan-arrange/training-plan-arrange?${q}`,
    fail: (e) => {
      console.error(e);
      uni.showToast({ title: '跳转失败', icon: 'none' });
    },
  });
};

// 选择计划
const selectPlan = (plan) => {
  selectedPlanId.value = plan.id;
  fetchPlanProjects(plan.id);
};

// 确认选择：绑定课堂后进入大屏遥控（Web / 小程序统一）
function goAfterPlanBound() {
  const selectedPlan = planList.value.find((p) => p.id === selectedPlanId.value)
  const q = [
    `lessonId=${lessonId.value}`,
    `planId=${selectedPlanId.value}`,
    `planTitle=${encodeURIComponent((selectedPlan && selectedPlan.planTitle) || '')}`,
    `lessonName=${encodeURIComponent(lessonName.value || '')}`,
    `courseName=${encodeURIComponent(courseName.value || '')}`,
  ].join('&')
  uni.navigateTo({
    url: `/pages/screen-control/screen-control?${q}`,
    fail: (err) => {
      console.error(err)
      uni.showToast({ title: '跳转失败', icon: 'none' })
    },
  })
}

const confirmPlan = () => {
  if (!selectedPlanId.value) return;

  const selectedPlan = planList.value.find(p => p.id === selectedPlanId.value);

  uni.showModal({
    title: '确认选择',
    content: `确定要选择「${selectedPlan.planTitle}」吗？`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        uni.showLoading({ title: '绑定课堂…' });
        await bindPlanToCurrentLesson({
          planId: selectedPlanId.value,
          lessonId: lessonId.value,
          courseId: courseId.value || undefined,
        });
        uni.hideLoading();
        goAfterPlanBound();
      } catch (err) {
        uni.hideLoading();
        console.error(err);
        uni.showToast({
          title: (err && err.message) || '绑定课堂失败',
          icon: 'none',
          duration: 2500,
        });
      }
    },
  });
};

// 获取项目类型文本
const getItemTypeText = (type) => {
  const types = { 1: '基础训练', 2: '强化训练', 3: '考核项目' };
  return types[type] || '未知';
};

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const texts = { 1: '简单', 2: '中等', 3: '困难' };
  return texts[difficulty] || '未知';
};

onShow(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};

  lessonId.value = parseInt(options.lessonId) || 0;
  courseId.value = parseInt(options.courseId) || 0;
  lessonName.value = options.lessonName || '';
  try {
    courseName.value = options.courseName ? decodeURIComponent(options.courseName) : '';
  } catch {
    courseName.value = options.courseName || '';
  }

  uni.setNavigationBarTitle({
    title: '选择训练计划'
  });

  planProjects.value = {};
  selectedPlanId.value = null;
  fetchPlanList();
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

/* 内容区域 */
.content-area {
  padding: 30rpx;
  margin-top: -30rpx;
  padding-bottom: 140rpx;
}

/* 计划列表 */
.plan-list {
  .plan-card {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    border: 2rpx solid transparent;

    &:active {
      opacity: 0.9;
    }

    &.selected {
      border-color: #07c160;
      background-color: #f0fff4;
    }
  }

  .plan-header {
    margin-bottom: 20rpx;

    .plan-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 16rpx;
    }

    .plan-tags {
      display: flex;
      gap: 12rpx;
    }

    .tag {
      font-size: 24rpx;
      padding: 6rpx 16rpx;
      border-radius: 8rpx;

      &.type-1 { background-color: #e6f7ed; color: #07c160; }
      &.type-2 { background-color: #fff2e8; color: #ff7d00; }
      &.type-3 { background-color: #f0f5ff; color: #2f54eb; }

      &.difficulty-1 { background-color: #f6ffed; color: #52c41a; }
      &.difficulty-2 { background-color: #fffbe6; color: #faad14; }
      &.difficulty-3 { background-color: #fff2f0; color: #ff4d4f; }
    }
  }

  .plan-meta {
    display: flex;
    gap: 40rpx;
    margin-bottom: 20rpx;

    .meta-item {
      font-size: 26rpx;

      .label {
        color: #999;
      }

      .value {
        color: #333;
        font-weight: 500;

        &.status-0 { color: #999; }
        &.status-1 { color: #07c160; }
        &.status-2 { color: #666; }
      }
    }
  }

  .plan-content {
    font-size: 26rpx;
    color: #666;
    padding: 20rpx;
    background-color: #f9f9f9;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
  }

  .plan-card-footer {
    margin-bottom: 16rpx;
  }

  .btn-edit-plan {
    width: 100%;
    height: 72rpx;
    line-height: 72rpx;
    font-size: 28rpx;
    color: #07c160;
    background-color: #f0fff4;
    border: 2rpx solid #07c160;
    border-radius: 12rpx;
    margin: 0;
    padding: 0;

    &::after {
      display: none;
    }

    &:active {
      opacity: 0.88;
    }
  }

  /* 训练项目 */
  .project-section {
    border-top: 1rpx solid #f0f0f0;
    padding-top: 20rpx;

    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 16rpx;
    }

    .project-item {
      background-color: #f9f9f9;
      border-radius: 12rpx;
      padding: 20rpx;
      margin-bottom: 12rpx;

      .project-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12rpx;

        .project-name {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
        }

        .project-type {
          font-size: 22rpx;
          padding: 4rpx 12rpx;
          border-radius: 6rpx;

          &.item-type-1 { background-color: #e6f7ed; color: #07c160; }
          &.item-type-2 { background-color: #fff2e8; color: #ff7d00; }
          &.item-type-3 { background-color: #f0f5ff; color: #2f54eb; }
        }
      }

      .project-meta {
        display: flex;
        gap: 24rpx;
        font-size: 24rpx;
        color: #666;

        .difficulty-1 { color: #52c41a; }
        .difficulty-2 { color: #faad14; }
        .difficulty-3 { color: #ff4d4f; }
      }
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
  background-color: #fff;
  border-radius: 20rpx;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 32rpx;
    color: #999;
    margin-bottom: 12rpx;
  }

  .empty-tip {
    font-size: 26rpx;
    color: #bbb;
  }
}

/* 底部按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 40rpx 40rpx;
  background-color: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);

  .confirm-btn {
    height: 90rpx;
    background: linear-gradient(135deg, #07c160, #0ebf8c);
    color: #fff;
    font-size: 32rpx;
    font-weight: bold;
    border-radius: 45rpx;
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

    &[disabled] {
      background: #ccc;
    }
  }
}
</style>
