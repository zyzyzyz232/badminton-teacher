<template>
	<view class="page">
		<page-nav-bar title="训练计划" :show-back="false" />
		<view class="header-bar">
			<text class="sub">管理训练计划与课中项目顺序</text>
		</view>

		<scroll-view scroll-y class="list-wrap" enable-flex>
			<view
				v-for="plan in planList"
				:key="plan.id"
				class="plan-card"
				@click="openArrange(plan.id)"
			>
				<view class="row-top">
					<text class="plan-name">{{ plan.title }}</text>
					<view class="row-actions" @click.stop>
						<text class="plan-delete-btn" @click.stop="confirmDeletePlan(plan)">删除</text>
						<text class="arrow">›</text>
					</view>
				</view>
				<text v-if="plan.subtitle" class="plan-sub">{{ plan.subtitle }}</text>
			</view>

			<view v-if="!loading && planList.length === 0" class="empty">
				<text class="empty-title">暂无训练计划</text>
				<text class="empty-tip">点击右下角新建，或检查网络与登录状态</text>
			</view>
		</scroll-view>

		<view class="fab-wrap">
			<button class="new-btn" type="primary" @click="openNewArrange">＋ 新建训练计划</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchTrainingPlanList, deleteTeachingPlan } from '../../services/trainingPlanApi.js'

const planList = ref([])
const loading = ref(false)

async function refresh() {
	loading.value = true
	try {
		const list = await fetchTrainingPlanList()
		planList.value = Array.isArray(list) ? list : []
	} catch (e) {
		planList.value = []
		console.warn('fetchTrainingPlanList', e)
	} finally {
		loading.value = false
	}
}

function openArrange(planId) {
	uni.navigateTo({
		url: `/pages/training-plan-info/training-plan-info?planId=${encodeURIComponent(planId)}`,
	})
}

function confirmDeletePlan(plan) {
	if (!plan || plan.id == null) return
	const pid = parseInt(String(plan.id), 10)
	if (!Number.isFinite(pid) || pid <= 0) return
	const title = (plan.title || '').trim() || '该训练计划'
	uni.showModal({
		title: '确认删除',
		content: `确定要删除「${title}」吗？删除后无法恢复。`,
		confirmColor: '#ff4d4f',
		success: async (res) => {
			if (!res.confirm) return
			try {
				uni.showLoading({ title: '删除中…' })
				await deleteTeachingPlan(pid)
				planList.value = planList.value.filter((x) => String(x.id) !== String(plan.id))
				uni.showToast({ title: '已删除', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: (e && e.message) || '删除失败', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
	})
}

function openNewArrange() {
	uni.navigateTo({
		url: '/pages/training-plan-info/training-plan-info?mode=new',
	})
}

onShow(() => {
	refresh()
})
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #f5f7fa;
	display: flex;
	flex-direction: column;
	/* 底部按钮区 + 原生 tabBar（约 100rpx） */
	padding-bottom: calc(220rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.header-bar {
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	padding: 8rpx 32rpx 32rpx;
	color: #fff;
}

.title {
	font-size: 40rpx;
	font-weight: 700;
	display: block;
	margin-bottom: 8rpx;
}

.sub {
	font-size: 24rpx;
	opacity: 0.92;
	display: block;
}

.list-wrap {
	flex: 1;
	padding: 24rpx;
	box-sizing: border-box;
	max-height: calc(100vh - 200rpx);
}

.plan-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.plan-card:active {
	opacity: 0.92;
}

.row-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.plan-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.row-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
	flex-shrink: 0;
}

.plan-delete-btn {
	font-size: 24rpx;
	color: #ff4d4f;
	padding: 6rpx 16rpx;
	border: 1rpx solid #ffccc7;
	border-radius: 8rpx;
	background: #fff2f0;
}

.arrow {
	font-size: 40rpx;
	color: #ccc;
	line-height: 1;
}

.plan-sub {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #999;
}

.empty {
	padding: 80rpx 32rpx;
	text-align: center;
}

.empty-title {
	font-size: 30rpx;
	color: #666;
	display: block;
	margin-bottom: 12rpx;
}

.empty-tip {
	font-size: 24rpx;
	color: #bbb;
	display: block;
}

.fab-wrap {
	position: fixed;
	left: 0;
	right: 0;
	/* 上移至 tabBar 上方（高度约 100rpx） */
	bottom: calc(100rpx + env(safe-area-inset-bottom));
	padding: 16rpx 28rpx 16rpx;
	background: #fff;
	box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.new-btn {
	margin: 0;
	height: 88rpx;
	line-height: 88rpx;
	font-size: 30rpx;
	border-radius: 44rpx;
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	border: none;
}

.new-btn::after {
	display: none;
}
</style>
