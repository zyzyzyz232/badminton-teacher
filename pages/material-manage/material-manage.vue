<template>
  <view class="container">
    <!-- 顶部信息 -->
    <view class="header">
      <view class="header-content">
        <text class="project-name">{{ projectName }}</text>
        <text class="plan-title">{{ planTitle }}</text>
      </view>
    </view>

    <!-- 资料列表 -->
    <scroll-view scroll-y class="material-list">
      <!-- 上传按钮 -->
      <view class="upload-section">
        <view class="upload-btn" @click="chooseFile">
          <text class="upload-icon">+</text>
          <text>上传资料（图片/视频）</text>
        </view>
      </view>

      <!-- 资料卡片 -->
      <view v-if="materialList.length > 0" class="material-cards">
        <view
          class="material-card"
          v-for="(item, index) in materialList"
          :key="item.id"
        >
          <!-- 图片类型 -->
          <view v-if="item.materialType === 1" class="material-image">
            <image
              :src="item.imageUrl"
              mode="aspectFill"
              @click="previewImage(item.imageUrl)"
            />
            <view class="material-type-tag image-tag">图片</view>
          </view>

          <!-- 视频类型 -->
          <view v-else-if="item.materialType === 2" class="material-video">
            <video
              :src="item.videoUrl"
              :poster="item.imageUrl"
              controls
            />
            <view class="material-type-tag video-tag">视频</view>
            <view v-if="item.duration" class="video-duration">
              {{ formatDuration(item.duration) }}
            </view>
          </view>

          <!-- 资料信息 -->
          <view class="material-info">
            <text class="material-title">{{ item.title || '未命名资料' }}</text>
            <text v-if="item.description" class="material-desc">{{ item.description }}</text>
            <text class="material-time">{{ formatTime(item.createTime) }}</text>
          </view>

          <!-- 删除按钮 -->
          <view class="material-actions">
            <text class="delete-btn" @click="deleteMaterial(item, index)">删除</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">📎</text>
        <text class="empty-text">暂无资料</text>
        <text class="empty-tip">点击上方按钮上传图片或视频</text>
      </view>
    </scroll-view>

    <!-- 上传弹窗 -->
    <view class="modal-mask" v-if="showUploadModal" @click="closeUploadModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">上传资料</text>
          <text class="modal-close" @click="closeUploadModal">×</text>
        </view>

        <view class="modal-body">
          <!-- 文件预览 -->
          <view class="file-preview" v-if="tempFilePath">
            <image
              v-if="uploadForm.materialType === 1"
              :src="tempFilePath"
              mode="aspectFit"
            />
            <video
              v-else
              :src="tempFilePath"
              controls
            />
          </view>

          <!-- 资料类型 -->
          <view class="form-item">
            <text class="form-label">资料类型</text>
            <picker mode="selector" :range="materialTypeOptions" :value="uploadForm.materialType - 1" @change="onMaterialTypeChange">
              <view class="form-picker">{{ materialTypeOptions[uploadForm.materialType - 1] }}</view>
            </picker>
          </view>

          <!-- 资料标题 -->
          <view class="form-item">
            <text class="form-label">标题（可选）</text>
            <input class="form-input" v-model="uploadForm.title" placeholder="如：正手高远球动作示范" />
          </view>

          <!-- 资料描述 -->
          <view class="form-item">
            <text class="form-label">描述（可选）</text>
            <textarea class="form-textarea" v-model="uploadForm.description" placeholder="请输入资料描述" />
          </view>
        </view>

        <view class="modal-footer">
          <button class="btn-cancel" @click="closeUploadModal">取消</button>
          <button class="btn-confirm" @click="uploadMaterial">上传</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = 'http://10.112.189.54:48080/admin-api'

// 页面参数
const planId = ref(0)
const itemId = ref(0)
const projectName = ref('')
const planTitle = ref('')

// 数据
const materialList = ref([])
const showUploadModal = ref(false)
const tempFilePath = ref('')

// 上传表单
const uploadForm = ref({
  materialType: 1,
  title: '',
  description: ''
})

const materialTypeOptions = ['图片', '视频']

// 获取token
const getToken = () => {
  return uni.getStorageSync('token') || ''
}

// 获取资料列表
const fetchMaterialList = async () => {
  try {
    uni.showLoading({ title: '加载中...' })

    const res = await uni.request({
      url: `${API_BASE}/teaching/plan-material/list-by-item`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      data: {
        planId: planId.value,
        itemId: itemId.value
      }
    })

    uni.hideLoading()

    if (res.data.code === 0) {
      materialList.value = res.data.data || []
    } else {
      uni.showToast({ title: res.data.msg || '获取失败', icon: 'none' })
    }
  } catch (e) {
    uni.hideLoading()
    console.log('获取资料列表失败', e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

// 选择文件
const chooseFile = () => {
  const isImage = uploadForm.value.materialType === 1

  if (isImage) {
    uni.chooseImage({
      count: 1,
      success: (res) => {
        tempFilePath.value = res.tempFilePaths[0]
        showUploadModal.value = true
      }
    })
  } else {
    uni.chooseVideo({
      success: (res) => {
        tempFilePath.value = res.tempFilePath
        showUploadModal.value = true
      }
    })
  }
}

// 关闭上传弹窗
const closeUploadModal = () => {
  showUploadModal.value = false
  tempFilePath.value = ''
  uploadForm.value = {
    materialType: 1,
    title: '',
    description: ''
  }
}

// 资料类型选择
const onMaterialTypeChange = (e) => {
  uploadForm.value.materialType = e.detail.value + 1
}

// 上传资料
const uploadMaterial = async () => {
  if (!tempFilePath.value) {
    uni.showToast({ title: '请选择文件', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '上传中...' })

    const uploadRes = await uni.uploadFile({
      url: `${API_BASE}/teaching/plan-material/upload`,
      filePath: tempFilePath.value,
      name: 'file',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      formData: {
        planId: planId.value,
        itemId: itemId.value,
        materialType: uploadForm.value.materialType,
        title: uploadForm.value.title || '',
        description: uploadForm.value.description || ''
      }
    })

    uni.hideLoading()

    const data = JSON.parse(uploadRes.data)
    if (data.code === 0) {
      uni.showToast({ title: '上传成功', icon: 'success' })
      closeUploadModal()
      fetchMaterialList()
    } else {
      uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
    }
  } catch (e) {
    uni.hideLoading()
    console.log('上传失败', e)
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
}

// 删除资料
const deleteMaterial = (item, index) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个资料吗？',
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        doDeleteMaterial(item.id, index)
      }
    }
  })
}

// 执行删除
const doDeleteMaterial = async (materialId, index) => {
  try {
    uni.showLoading({ title: '删除中...' })

    // 调用删除接口（如果有的话）
    // const res = await uni.request({
    //   url: `${API_BASE}/teaching/plan-material/delete?id=${materialId}`,
    //   method: 'DELETE',
    //   header: { 'Authorization': `Bearer ${getToken()}` }
    // })

    // 暂时从列表中移除
    materialList.value.splice(index, 1)

    uni.hideLoading()
    uni.showToast({ title: '删除成功', icon: 'success' })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

// 预览图片
const previewImage = (url) => {
  uni.previewImage({
    urls: [url]
  })
}

// 格式化视频时长
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options

  planId.value = parseInt(options.planId) || 0
  itemId.value = parseInt(options.itemId) || 0
  projectName.value = options.projectName || '训练项目'
  planTitle.value = options.planTitle || ''

  uni.setNavigationBarTitle({
    title: '资料管理'
  })

  if (planId.value && itemId.value) {
    fetchMaterialList()
  }
})
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 顶部信息 */
.header {
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  padding: 40rpx;
}

.header-content {
  text-align: center;
  color: #fff;
}

.project-name {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.plan-title {
  font-size: 26rpx;
  opacity: 0.9;
}

/* 资料列表 */
.material-list {
  padding: 20rpx;
}

/* 上传按钮 */
.upload-section {
  margin-bottom: 20rpx;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  color: #07c160;
  font-size: 30rpx;
  border: 2rpx dashed #07c160;
}

.upload-btn:active {
  background-color: #f0f9eb;
}

.upload-icon {
  font-size: 48rpx;
  margin-right: 16rpx;
  font-weight: bold;
}

/* 资料卡片 */
.material-cards {
  padding-bottom: 40rpx;
}

.material-card {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}

.material-image {
  position: relative;
  width: 100%;
  height: 400rpx;
}

.material-image image {
  width: 100%;
  height: 100%;
}

.material-video {
  position: relative;
  width: 100%;
  height: 400rpx;
}

.material-video video {
  width: 100%;
  height: 100%;
}

.material-type-tag {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  color: #fff;
}

.image-tag {
  background-color: #07c160;
}

.video-tag {
  background-color: #ff7d00;
}

.video-duration {
  position: absolute;
  bottom: 16rpx;
  right: 16rpx;
  font-size: 24rpx;
  color: #fff;
  background-color: rgba(0,0,0,0.6);
  padding: 6rpx 12rpx;
  border-radius: 6rpx;
}

/* 资料信息 */
.material-info {
  padding: 24rpx;
}

.material-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.material-desc {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.material-time {
  font-size: 24rpx;
  color: #999;
}

/* 操作按钮 */
.material-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 24rpx 24rpx;
}

.delete-btn {
  font-size: 26rpx;
  color: #ff4d4f;
  padding: 8rpx 20rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 150rpx 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-tip {
  font-size: 28rpx;
  color: #999;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background-color: #fff;
  border-radius: 20rpx;
  width: 80%;
  max-width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.file-preview {
  width: 100%;
  height: 300rpx;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.file-preview image,
.file-preview video {
  width: 100%;
  height: 100%;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.form-input, .form-picker {
  height: 80rpx;
  background-color: #f5f7fa;
  border-radius: 10rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  display: flex;
  align-items: center;
}

.form-textarea {
  min-height: 160rpx;
  background-color: #f5f7fa;
  border-radius: 10rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  width: 100%;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 40rpx;
  gap: 20rpx;
}

.modal-footer button {
  flex: 1;
  height: 80rpx;
  border-radius: 10rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.modal-footer button::after {
  display: none;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #07c160, #0ebf8c);
  color: #fff;
}
</style>
