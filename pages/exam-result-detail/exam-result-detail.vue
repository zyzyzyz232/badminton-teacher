<template>
  <view class="page">
    <page-nav-bar title="成绩详情" />

    <view v-if="detail" class="hero card">
      <view class="hero-top">
        <text class="hero-item">{{ detail.itemName || '考核项' }}</text>
        <text class="hero-status">{{ detail.statusText || statusText(detail.status) }}</text>
      </view>
      <view class="hero-score-row">
        <text class="hero-score">{{ formatScore(detail.algoScore) }}</text>
        <text class="hero-score-unit">AI 初分</text>
      </view>
      <text v-if="analysis.statLine" class="hero-meta">{{ analysis.statLine }}</text>
      <text v-if="analysis.typeLabel" class="hero-type">{{ analysis.typeLabel }}</text>
      <view v-if="detail.failReason" class="fail-box">
        <text class="fail-title">失败原因</text>
        <text class="fail-body">{{ detail.failReason }}</text>
      </view>
    </view>

    <view v-if="analysis.llmSummary" class="card">
      <text class="section-title">AI 总评</text>
      <text class="body-text">{{ analysis.llmSummary }}</text>
    </view>
    <view v-else-if="detail && detail.resultSummary && !analysis.hasJson" class="card">
      <text class="section-title">分析摘要</text>
      <text class="body-text">{{ detail.resultSummary }}</text>
    </view>

    <view v-if="analysis.problems.length" class="card">
      <text class="section-title">主要问题</text>
      <view v-for="(p, idx) in analysis.problems" :key="'p-' + idx" class="issue">
        <text class="issue-tag">{{ p.aspect || '问题' }}</text>
        <text class="body-text">{{ p.description }}</text>
      </view>
    </view>

    <view v-if="analysis.suggestions.length" class="card">
      <text class="section-title">改进建议</text>
      <view v-for="(s, idx) in analysis.suggestions" :key="'s-' + idx" class="issue">
        <text class="issue-tag suggest">{{ s.item || '建议' }}</text>
        <text class="body-text">{{ s.detail }}</text>
      </view>
    </view>

    <view v-if="analysis.actions.length" class="card">
      <text class="section-title">逐拍得分</text>
      <view
        v-for="act in analysis.actions"
        :key="act.key"
        class="action-card"
        @click="toggleAction(act.key)"
      >
        <view class="action-head">
          <text class="action-name">{{ act.title }}</text>
          <text class="action-overall">{{ formatScore(act.overall) }}</text>
        </view>
        <view v-for="dim in scoreDims" :key="act.key + dim.key" class="bar-row">
          <text class="bar-label">{{ dim.label }}</text>
          <view class="bar-track">
            <view class="bar-fill" :style="{ width: barWidth(act.scores[dim.key]) }" />
          </view>
          <text class="bar-num">{{ formatScore(act.scores[dim.key]) }}</text>
        </view>
        <view v-if="expandedKey === act.key && act.clipVideo" class="clip-wrap" @click.stop>
          <video
            class="clip"
            :src="act.clipVideo"
            controls
            object-fit="contain"
            :show-center-play-btn="true"
          />
        </view>
        <text v-else-if="act.clipVideo" class="clip-hint">点击查看动作片段</text>
      </view>
    </view>

    <view v-if="canReview" class="card">
      <view class="row col">
        <text class="label">最终分</text>
        <input v-model="finalScore" class="input" type="digit" placeholder="请输入最终分" />
      </view>
      <view class="row col">
        <text class="label">评语</text>
        <textarea v-model="comment" class="textarea" placeholder="选填" />
      </view>
      <button class="btn-primary" :disabled="saving" @click="submitReview">确认成绩</button>
    </view>

    <view v-else-if="detail && Number(detail.status) === 5" class="hint">缺考记录不可改分</view>
    <view v-else-if="detail && Number(detail.status) === 1" class="hint">计算中，请稍后刷新</view>
    <view v-else-if="detail && Number(detail.status) === 4" class="card">
      <text class="hint">分析失败，可在考场重新提交视频</text>
      <button class="btn-ghost" :disabled="saving" @click="onRetry">重试分析</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import {
  fetchExamScoreGet,
  reviewExamScore,
  retryExamScore,
  examScoreStatusText,
} from '../../services/examApi.js'

const scoreDims = [
  { key: 'overall', label: '综合' },
  { key: 'standardness', label: '标准度' },
  { key: 'continuity', label: '连贯性' },
  { key: 'explosiveness', label: '爆发力' },
]

const scoreId = ref(0)
const detail = ref(null)
const finalScore = ref('')
const comment = ref('')
const saving = ref(false)
const canReview = ref(false)
const expandedKey = ref('')
let pollTimer = null

const analysis = computed(() => parseAlgoResult(detail.value))

function statusText(status) {
  return examScoreStatusText(status)
}

function formatScore(v) {
  if (v == null || v === '') return '--'
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(1) : String(v)
}

function barWidth(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0%'
  return Math.max(0, Math.min(100, n)).toFixed(1) + '%'
}

function analysisTypeLabel(type) {
  if (type === 'repeated_forehand_high_serve') return '正手高远发球'
  return type || ''
}

function actionTitle(name, idx) {
  const m = String(name || '').match(/action_(\d+)/i)
  if (m) return '第 ' + Number(m[1]) + ' 拍'
  return '第 ' + (idx + 1) + ' 拍'
}

function safeClipUrl(url) {
  const s = String(url || '')
  if (!s) return ''
  if (s.includes('10.101.166.129')) return ''
  return s
}

function parseAlgoResult(data) {
  const empty = {
    hasJson: false,
    statLine: '',
    typeLabel: '',
    llmSummary: '',
    problems: [],
    suggestions: [],
    actions: [],
  }
  if (!data || data.resultJson == null || data.resultJson === '') return empty
  let obj = data.resultJson
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj)
    } catch {
      return empty
    }
  }
  if (!obj || typeof obj !== 'object') return empty
  const summary = obj.summary || {}
  const detected = summary.actions_detected
  const scored = summary.actions_scored
  const statParts = []
  if (detected != null && detected !== '') statParts.push('检出 ' + detected + ' 拍')
  if (scored != null && scored !== '') statParts.push('计分 ' + scored + ' 拍')
  const llm = obj.llm_analysis || {}
  const rawActions = Array.isArray(obj.actions) ? obj.actions : []
  const actions = rawActions.map((row, idx) => {
    const scores = (row && row.scores) || {}
    return {
      key: String((row && row.action) || idx),
      title: actionTitle(row && row.action, idx),
      overall: scores.overall,
      scores: {
        overall: scores.overall,
        standardness: scores.standardness,
        continuity: scores.continuity,
        explosiveness: scores.explosiveness,
      },
      clipVideo: safeClipUrl(row && (row.clip_video || row.clipVideo)),
    }
  })
  const problems = Array.isArray(llm.problems)
    ? llm.problems.map((p) => ({
        aspect: p && p.aspect,
        description: p && p.description,
      }))
    : []
  const suggestions = Array.isArray(llm.suggestions)
    ? llm.suggestions.map((s) => ({
        item: s && s.item,
        detail: s && s.detail,
      }))
    : []
  return {
    hasJson: true,
    statLine: statParts.join(' · '),
    typeLabel: analysisTypeLabel(obj.analysis_type || obj.analysisType),
    llmSummary: llm.summary || '',
    problems,
    suggestions,
    actions,
  }
}

function toggleAction(key) {
  expandedKey.value = expandedKey.value === key ? '' : key
}

function applyDetail(data) {
  detail.value = data || null
  const st = Number(data && data.status)
  canReview.value = st === 2 || st === 3
  if (data && data.finalScore != null && data.finalScore !== '') {
    finalScore.value = String(data.finalScore)
  } else if (data && data.algoScore != null) {
    finalScore.value = String(data.algoScore)
  }
  comment.value = (data && data.comment) || ''
  if (st === 1) startPoll()
  else stopPoll()
}

function startPoll() {
  stopPoll()
  pollTimer = setInterval(() => {
    loadDetail(true)
  }, 3000)
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function loadDetail(silent) {
  if (!scoreId.value) return
  try {
    const data = await fetchExamScoreGet(scoreId.value)
    applyDetail(data)
  } catch (e) {
    if (!silent) uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

async function submitReview() {
  const score = Number(finalScore.value)
  if (!Number.isFinite(score)) {
    uni.showToast({ title: '请输入有效分数', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await reviewExamScore({
      id: scoreId.value,
      finalScore: score,
      comment: comment.value || '',
    })
    uni.showToast({ title: '已完成', icon: 'success' })
    await loadDetail()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

async function onRetry() {
  saving.value = true
  try {
    await retryExamScore(scoreId.value)
    uni.showToast({ title: '已重新入队', icon: 'none' })
    await loadDetail()
  } catch (e) {
    uni.showToast({ title: e.message || '重试失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad((options) => {
  scoreId.value = parseInt((options && options.id) || '0', 10) || 0
  if (!scoreId.value) {
    uni.showToast({ title: '缺少成绩编号', icon: 'none' })
    return
  }
  loadDetail()
})

onUnload(() => {
  stopPoll()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 48rpx;
}
.card {
  margin: 24rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 16rpx;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hero-item {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}
.hero-status {
  font-size: 22rpx;
  color: #07c160;
  background: #e8f8ef;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
}
.hero-score-row {
  display: flex;
  align-items: baseline;
  margin-top: 16rpx;
}
.hero-score {
  font-size: 72rpx;
  font-weight: 800;
  color: #07c160;
  line-height: 1;
}
.hero-score-unit {
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #888;
}
.hero-meta,
.hero-type {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #888;
}
.fail-box {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #fff5f5;
  border-radius: 12rpx;
}
.fail-title {
  display: block;
  font-size: 22rpx;
  color: #ff4d4f;
  margin-bottom: 6rpx;
}
.fail-body {
  font-size: 26rpx;
  color: #a33;
  line-height: 1.5;
}
.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}
.body-text {
  display: block;
  font-size: 26rpx;
  color: #444;
  line-height: 1.7;
}
.issue {
  margin-bottom: 20rpx;
}
.issue:last-child {
  margin-bottom: 0;
}
.issue-tag {
  display: inline-block;
  font-size: 22rpx;
  color: #d46b08;
  background: #fff7e6;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}
.issue-tag.suggest {
  color: #07c160;
  background: #e8f8ef;
}
.action-card {
  padding: 20rpx 0;
  border-top: 1rpx solid #f0f0f0;
}
.action-card:first-of-type {
  border-top: none;
  padding-top: 0;
}
.action-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.action-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
}
.action-overall {
  font-size: 28rpx;
  font-weight: 700;
  color: #07c160;
}
.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}
.bar-label {
  width: 96rpx;
  font-size: 22rpx;
  color: #888;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 12rpx;
  background: #eef2f6;
  border-radius: 8rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: #07c160;
  border-radius: 8rpx;
}
.bar-num {
  width: 72rpx;
  text-align: right;
  font-size: 22rpx;
  color: #555;
  flex-shrink: 0;
}
.clip-hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #07c160;
}
.clip-wrap {
  margin-top: 12rpx;
}
.clip {
  width: 100%;
  height: 360rpx;
  background: #000;
  border-radius: 12rpx;
}
.row {
  display: flex;
  margin-bottom: 20rpx;
  &.col {
    flex-direction: column;
  }
}
.label {
  width: 140rpx;
  color: #999;
  font-size: 26rpx;
  margin-bottom: 8rpx;
}
.input,
.textarea {
  width: 100%;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 16rpx;
  box-sizing: border-box;
  font-size: 28rpx;
}
.textarea {
  min-height: 160rpx;
}
.btn-primary {
  margin-top: 16rpx;
  background: #07c160;
  color: #fff;
}
.btn-ghost {
  margin-top: 16rpx;
  background: #f5f7fa;
  color: #333;
}
.hint {
  margin: 24rpx;
  font-size: 26rpx;
  color: #888;
}
</style>
