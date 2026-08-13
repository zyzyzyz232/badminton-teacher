<template>
  <view class="page-container">
    <page-nav-bar :title="isEdit ? '编辑考核项' : '添加考核项'" />
    <view class="top-bg">
      <view class="class-info">
        <text class="class-name">{{ examTitle }}</text>
        <text class="subtitle">名称 · 满分 · 权重 · 算法 · 资料</text>
      </view>
    </view>

    <view class="content-area">
      <view class="form-card">
        <view class="form-title">考核项信息</view>
        <view class="hint-row">
          其他项已占权重 {{ othersWeight }}%，本项保存后合计建议为 100%
        </view>

        <view class="form-item">
          <text class="form-label">名称</text>
          <input class="form-input" v-model="form.itemName" placeholder="如：发球 / 高远球" maxlength="100" />
        </view>

        <view class="form-item">
          <text class="form-label">满分</text>
          <input class="form-input" type="number" v-model="maxScoreText" placeholder="如 100" />
        </view>

        <view class="form-item">
          <text class="form-label">项内权重（%）</text>
          <input class="form-input" type="number" v-model="weightText" placeholder="各项之和须为 100" />
        </view>

        <view class="form-item">
          <text class="form-label">算法类型</text>
          <view class="type-segment">
            <view
              v-for="(label, idx) in algoOptions"
              :key="idx"
              class="type-segment-item"
              :class="{ active: form.algoType === idx + 1 }"
              @click="form.algoType = idx + 1"
            >
              {{ label }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">排序</text>
          <input class="form-input" type="number" v-model="sortText" placeholder="数字越小越靠前" />
        </view>
      </view>

      <button class="submit-btn" :loading="saving" @click="saveItem">
        {{ isEdit ? '保存考核项' : '创建考核项' }}
      </button>

      <view v-if="isEdit" class="material-section">
        <view class="section-head">
          <text class="section-title">教学资料（选填）</text>
          <view class="type-segment type-inline">
            <view
              v-for="(label, idx) in materialTypeOptions"
              :key="idx"
              class="type-segment-item"
              :class="{ active: uploadType === idx + 1 }"
              @click="uploadType = idx + 1"
            >
              {{ label }}
            </view>
          </view>
        </view>
        <view class="upload-btn" @click="chooseAndUpload">
          <text>+ 上传{{ uploadType === 1 ? '图片' : '视频' }}</text>
        </view>

        <view v-if="materialList.length > 0" class="material-list">
          <view
            v-for="(m, index) in materialList"
            :key="m.id || 'm-' + index"
            class="material-card"
          >
            <view v-if="m.materialType === 1" class="media-box" @click="previewImage(m.imageUrl)">
              <image :src="m.imageUrl" mode="aspectFill" class="thumb" />
              <text class="tag">图片</text>
            </view>
            <view v-else class="media-box">
              <video v-if="m.videoUrl" :src="m.videoUrl" class="thumb-video" controls />
              <text class="tag">视频</text>
            </view>
            <view class="material-info">
              <text class="material-title">{{ m.title || '未命名资料' }}</text>
              <text v-if="m.description" class="material-desc">{{ m.description }}</text>
            </view>
            <view class="material-actions">
              <text class="del" @click="confirmDeleteMaterial(m, index)">删除</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-mat">
          <text>暂无资料，可稍后补充</text>
        </view>
      </view>
      <view v-else class="hint-after-create">
        <text>创建成功后可在本页选填教学资料</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  fetchExamItemListByExam,
  fetchExamItemGet,
  createExamItem,
  updateExamItem,
  fetchExamItemMaterialList,
  deleteExamItemMaterial,
  uploadAndCreateExamItemMaterial,
  resolveExamItemId,
  calcItemWeightSum,
  normalizeCreateLongId,
} from '../../services/examApi.js'

const examId = ref(0)
const examItemId = ref(0)
const examTitle = ref('')
const courseId = ref(0)
const classId = ref(0)
const className = ref('')
const isEdit = computed(() => examItemId.value > 0)

const form = reactive({
  itemName: '',
  maxScore: 100,
  weight: 0,
  algoType: 1,
  sortOrder: 0,
})
const maxScoreText = ref('100')
const weightText = ref('')
const sortText = ref('0')
const algoOptions = ['动作识别', '落点检测']
const materialTypeOptions = ['图片', '视频']
const uploadType = ref(1)
const materialList = ref([])
const siblingItems = ref([])
const saving = ref(false)

const othersWeight = computed(() =>
  calcItemWeightSum(siblingItems.value, isEdit.value ? examItemId.value : 0)
)

function hideLoadingThenToast(title, icon = 'none', duration = 2000) {
  uni.hideLoading()
  setTimeout(() => {
    uni.showToast({ title, icon, duration })
  }, 80)
}

function decodeName(raw, fallback = '') {
  if (!raw) return fallback
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

async function loadSiblings() {
  if (!examId.value) return
  try {
    const data = await fetchExamItemListByExam(examId.value)
    siblingItems.value = Array.isArray(data) ? data : []
  } catch {
    siblingItems.value = []
  }
}

async function loadDetail() {
  if (!examItemId.value) return
  uni.showLoading({ title: '加载中...' })
  try {
    let data = null
    try {
      data = await fetchExamItemGet(examItemId.value)
    } catch {
      data = siblingItems.value.find((r) => resolveExamItemId(r) === examItemId.value) || null
    }
    if (data) {
      form.itemName = data.itemName || data.name || ''
      form.maxScore = Number(data.maxScore) || 100
      form.weight = Number(data.weight) || 0
      form.algoType = Number(data.algoType) || 1
      form.sortOrder = Number(data.sortOrder ?? data.sort ?? 0) || 0
      maxScoreText.value = String(form.maxScore)
      weightText.value = String(form.weight)
      sortText.value = String(form.sortOrder)
    }
    await loadMaterials()
  } catch (e) {
    hideLoadingThenToast(e.message || '加载失败')
    return
  }
  uni.hideLoading()
}

async function loadMaterials() {
  if (!examItemId.value) {
    materialList.value = []
    return
  }
  try {
    const data = await fetchExamItemMaterialList(examItemId.value)
    materialList.value = Array.isArray(data) ? data : []
  } catch {
    materialList.value = []
  }
}

async function saveItem() {
  const itemName = (form.itemName || '').trim()
  if (!itemName) {
    uni.showToast({ title: '请填写名称', icon: 'none' })
    return
  }
  const maxScore = parseInt(String(maxScoreText.value).trim(), 10)
  if (!Number.isFinite(maxScore) || maxScore < 1) {
    uni.showToast({ title: '满分须为正整数', icon: 'none' })
    return
  }
  const weight = parseInt(String(weightText.value).trim(), 10)
  if (!Number.isFinite(weight) || weight < 1 || weight > 100) {
    uni.showToast({ title: '权重须为 1–100 的整数', icon: 'none' })
    return
  }
  const total = othersWeight.value + weight
  if (total > 100) {
    uni.showToast({
      title: `权重合计将为 ${total}%（已超 100%）`,
      icon: 'none',
      duration: 2500,
    })
    return
  }
  if (siblingItems.value.length > 0 || isEdit.value) {
    if (total !== 100) {
      // 弱提示：允许多项逐步填，但告知
      const remain = 100 - total
      if (remain !== 0) {
        uni.showModal({
          title: '权重提示',
          content:
            remain > 0
              ? `保存后合计 ${total}%，还需分配 ${remain}%。是否继续保存？`
              : `保存后合计 ${total}%。是否继续保存？`,
          success: (res) => {
            if (res.confirm) doSave(itemName, maxScore, weight)
          },
        })
        return
      }
    }
  }

  await doSave(itemName, maxScore, weight)
}

async function doSave(itemName, maxScore, weight) {
  const sortOrder = parseInt(String(sortText.value).trim(), 10)
  const sort = Number.isFinite(sortOrder) ? sortOrder : 0
  saving.value = true
  uni.showLoading({ title: '保存中...' })
  try {
    const body = {
      examId: examId.value,
      itemName,
      maxScore,
      weight,
      algoType: form.algoType,
      sortOrder: sort,
    }
    if (isEdit.value) {
      await updateExamItem({ id: examItemId.value, ...body })
      await loadSiblings()
      hideLoadingThenToast('已保存', 'success')
    } else {
      const data = await createExamItem(body)
      const newId = normalizeCreateLongId(data) || resolveExamItemId(data)
      if (newId) {
        examItemId.value = newId
        await loadSiblings()
        await loadMaterials()
        hideLoadingThenToast('已创建', 'success')
      } else {
        hideLoadingThenToast('已创建', 'success')
        setTimeout(() => uni.navigateBack(), 600)
      }
    }
  } catch (e) {
    hideLoadingThenToast(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function chooseAndUpload() {
  if (!examItemId.value) {
    uni.showToast({ title: '请先保存考核项', icon: 'none' })
    return
  }
  if (uploadType.value === 1) {
    uni.chooseImage({
      count: 1,
      success: (res) => {
        doUpload(res.tempFilePaths[0])
      },
    })
  } else {
    uni.chooseVideo({
      success: (res) => {
        doUpload(res.tempFilePath)
      },
    })
  }
}

async function doUpload(filePath) {
  if (!filePath) return
  uni.showLoading({ title: '上传中...', mask: true })
  let errMsg = ''
  try {
    await uploadAndCreateExamItemMaterial({
      filePath,
      examItemId: examItemId.value,
      materialType: uploadType.value,
      title: '',
      description: '',
    })
  } catch (e) {
    errMsg = e.message || '上传失败'
  } finally {
    uni.hideLoading()
  }
  if (errMsg) {
    setTimeout(() => {
      uni.showToast({ title: errMsg, icon: 'none', duration: 2800 })
    }, 80)
    return
  }
  await loadMaterials()
  setTimeout(() => {
    uni.showToast({ title: '上传成功', icon: 'success' })
  }, 80)
}

function confirmDeleteMaterial(m, index) {
  const id = m.id
  if (!id) {
    materialList.value.splice(index, 1)
    return
  }
  uni.showModal({
    title: '确认删除',
    content: '确定删除该资料吗？',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '删除中...' })
      try {
        await deleteExamItemMaterial(id)
        await loadMaterials()
        hideLoadingThenToast('已删除', 'success')
      } catch (e) {
        hideLoadingThenToast(e.message || '删除失败')
      }
    },
  })
}

function previewImage(url) {
  if (!url) return
  uni.previewImage({ urls: [url] })
}

onLoad(async (options) => {
  options = options || {}
  examId.value = parseInt(options.examId, 10) || 0
  examItemId.value = parseInt(options.examItemId, 10) || 0
  examTitle.value = decodeName(options.examTitle, '考核项')
  courseId.value = parseInt(options.courseId, 10) || 0
  classId.value = parseInt(options.classId, 10) || 0
  className.value = decodeName(options.className)
  await loadSiblings()
  if (isEdit.value) {
    await loadDetail()
  } else if (siblingItems.value.length === 0) {
    weightText.value = '100'
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 60rpx;
}

.top-bg {
  height: 220rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 50rpx 40rpx;
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
  font-size: 36rpx;
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
  margin-top: -36rpx;
}

.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 36rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 16rpx;
  border-left: 8rpx solid #07c160;
}

.hint-row {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 28rpx;
  background: #f5f7fa;
  padding: 14rpx 18rpx;
  border-radius: 8rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 14rpx;
  font-weight: 500;
}

.form-input {
  height: 88rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  color: #333;
  box-sizing: border-box;
}

.type-segment {
  display: flex;
  gap: 16rpx;
}

.type-segment-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  background: #f5f7fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #666;

  &.active {
    background: #e6f9ef;
    color: #07c160;
    font-weight: 600;
  }
}

.type-inline {
  flex: none;
  .type-segment-item {
    flex: none;
    padding: 10rpx 24rpx;
    font-size: 24rpx;
  }
}

.submit-btn {
  margin-top: 40rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;

  &::after {
    display: none;
  }
}

.material-section {
  margin-top: 40rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.upload-btn {
  background: #f5f7fa;
  border: 2rpx dashed #07c160;
  color: #07c160;
  text-align: center;
  padding: 28rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}

.material-card {
  border-top: 1rpx solid #f0f0f0;
  padding: 24rpx 0;
}

.media-box {
  position: relative;
  margin-bottom: 12rpx;
}

.thumb {
  width: 100%;
  height: 280rpx;
  border-radius: 12rpx;
  background: #eee;
}

.thumb-video {
  width: 100%;
  height: 280rpx;
  border-radius: 12rpx;
}

.tag {
  position: absolute;
  left: 16rpx;
  top: 16rpx;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.material-title {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.material-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-top: 6rpx;
}

.material-actions {
  margin-top: 12rpx;
}

.del {
  color: #ff4d4f;
  font-size: 26rpx;
}

.empty-mat,
.hint-after-create {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #999;
  text-align: center;
  padding: 20rpx;
}
</style>
