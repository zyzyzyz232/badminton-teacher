/**
 * 考核识别：场地摄像头绑定与算法通道（后端待接入，当前为占位实现）。
 */
const ACTION_RECOGNITION_BASE_URL = 'http://10.101.166.129:8000';
const ACTION_RECOGNITION_ANALYZE_PATH = '/api/v1/forehand-clear/analyze-video';

export function mapExamTypeToAlgorithm(examType) {
  if (examType === 'landing') return 'landing_detection';
  if (examType === 'action_recognition') return 'action_recognition';
  return 'unknown';
}

function parseUploadData(rawData) {
  if (!rawData) return {};
  if (typeof rawData === 'string') {
    try {
      return JSON.parse(rawData);
    } catch {
      throw new Error('动作识别服务返回数据解析失败');
    }
  }
  if (typeof rawData === 'object') return rawData;
  throw new Error('动作识别服务返回格式不支持');
}

/**
 * 上传动作识别测试视频并创建分析任务。
 * @param {string} filePath
 * @returns {Promise<{ requestId: string; status: string; resultUrl: string }>}
 */
export async function uploadActionRecognitionVideo(filePath) {
  if (!filePath) throw new Error('缺少视频文件路径');
  const uploadRes = await uni.uploadFile({
    url: `${ACTION_RECOGNITION_BASE_URL}${ACTION_RECOGNITION_ANALYZE_PATH}`,
    filePath,
    name: 'file'
  });
  const data = parseUploadData(uploadRes?.data);
  const requestId = data?.request_id;
  const status = data?.status;
  if (!requestId || !status) {
    throw new Error('动作识别服务返回缺少 request_id 或 status');
  }
  return {
    requestId,
    status,
    resultUrl: data?.result_url || ''
  };
}

/**
 * 按场地编号请求拉流地址 / 设备绑定（接口待开发）。
 * @param {string} venueId
 * @param {Record<string, unknown>} [options]
 * @returns {Promise<{ streamUrl: string; sessionToken: string | null }>}
 */
export function bindCameraByVenue(venueId, options = {}) {
  console.log('[examRecognition] bindCameraByVenue', venueId, options);
  return Promise.resolve({ streamUrl: '', sessionToken: null });
}

/**
 * 开始识别：先绑定场地摄像头，再按考核项目选择算法通道（算法接口待补）。
 * @param {object} payload
 * @param {string} payload.venueId
 * @param {string} payload.examType
 * @param {number} [payload.courseId]
 * @param {number} [payload.classId]
 * @param {number} [payload.classStudentId]
 * @param {number|string} [payload.userId]
 */
export async function startRecognition(payload) {
  const { venueId, examType, filePath, ...rest } = payload;
  await bindCameraByVenue(venueId, rest);
  const algorithmKey = mapExamTypeToAlgorithm(examType);
  console.log('[examRecognition] start algorithm channel', algorithmKey, payload);
  if (examType === 'action_recognition') {
    const { requestId, status, resultUrl } = await uploadActionRecognitionVideo(filePath);
    return {
      localSessionId: `local_${Date.now()}`,
      algorithmKey,
      requestId,
      status,
      resultUrl
    };
  }
  const localSessionId = `local_${Date.now()}`;
  return { localSessionId, algorithmKey };
}

/**
 * 结束识别（对称停止算法与释放摄像头相关会话，接口待补）。
 * @param {string | null | undefined} sessionId
 */
export async function stopRecognition(sessionId) {
  console.log('[examRecognition] stopRecognition', sessionId);
}
