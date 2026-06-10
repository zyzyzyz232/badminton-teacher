<template>
	<view class="page-nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view v-if="showBack" class="nav-back" @click="handleBack">
			<text class="nav-back-icon">‹</text>
			<text class="nav-back-text">返回</text>
		</view>
		<view v-else class="nav-side-placeholder" />
		<text class="nav-title">{{ title }}</text>
		<view class="nav-side-placeholder" />
	</view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	title: {
		type: String,
		default: '',
	},
	showBack: {
		type: Boolean,
		default: true,
	},
	fallbackUrl: {
		type: String,
		default: '/pages/home/home',
	},
})

const statusBarHeight = ref(0)
try {
	statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
} catch {
	statusBarHeight.value = 0
}

const TAB_PATHS = new Set([
	'/pages/home/home',
	'/pages/my-courses/my-courses',
	'/pages/training-plan/training-plan',
	'/pages/me/me',
])

function handleBack() {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
		return
	}
	if (!props.fallbackUrl) return
	const path = props.fallbackUrl.split('?')[0]
	if (TAB_PATHS.has(path)) {
		uni.switchTab({ url: path })
		return
	}
	uni.redirectTo({
		url: props.fallbackUrl,
		fail: () => {
			uni.navigateBack()
		},
	})
}
</script>

<style scoped>
.page-nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 44px;
	padding: 0 24rpx 16rpx;
	background: linear-gradient(135deg, #07c160, #0ebf8c);
	color: #fff;
	flex-shrink: 0;
	box-sizing: content-box;
}

.nav-back {
	display: flex;
	align-items: center;
	min-width: 120rpx;
	padding: 8rpx 0;
}

.nav-back-icon {
	font-size: 44rpx;
	line-height: 1;
	margin-right: 4rpx;
	font-weight: 300;
}

.nav-back-text {
	font-size: 28rpx;
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	padding: 0 8rpx;
}

.nav-side-placeholder {
	min-width: 120rpx;
}
</style>
