<template>
	<view class="page">
		<page-nav-bar title="训练计划安排" />
		<text class="hint">正在跳转…</text>
	</view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'

/** 兼容旧链接：重定向到 training-plan-info */
onLoad((opt) => {
	const parts = []
	if (opt && typeof opt === 'object') {
		Object.keys(opt).forEach((k) => {
			if (opt[k] != null && opt[k] !== '') {
				parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(opt[k]))}`)
			}
		})
	}
	const query = parts.length ? `?${parts.join('&')}` : ''
	uni.redirectTo({
		url: `/pages/training-plan-info/training-plan-info${query}`,
		fail: () => {
			uni.showToast({ title: '跳转失败', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 600)
		},
	})
})
</script>

<style scoped>
.page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f7fa;
}

.hint {
	font-size: 28rpx;
	color: #999;
}
</style>
