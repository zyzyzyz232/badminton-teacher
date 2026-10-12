/**
 * 考核识别占位：动作分析已改为 admin-api 成绩接口，禁止直连算法 IP。
 */

export function mapExamTypeToAlgorithm(examType) {
  if (examType === 'landing') return 'landing_detection';
  if (examType === 'action_recognition') return 'action_analysis';
  return 'unknown';
}

/**
 * 按场地编号请求拉流地址 / 设备绑定（接口待开发）。
 */
export function bindCameraByVenue(venueId, options = {}) {
  console.log('[examRecognition] bindCameraByVenue', venueId, options);
  return Promise.resolve({ streamUrl: '', sessionToken: null });
}

/**
 * 开始识别：落点仍占位。动作分析请走 examApi.submitExamScoreVideo。
 */
export async function startRecognition(payload) {
  const { venueId, examType } = payload;
  if (venueId) await bindCameraByVenue(venueId, payload);
  const algorithmKey = mapExamTypeToAlgorithm(examType);
  if (examType === 'action_recognition') {
    throw new Error('请通过考试成绩接口提交视频，勿直连算法服务');
  }
  return { localSessionId: `local_${Date.now()}`, algorithmKey };
}

export async function stopRecognition(sessionId) {
  console.log('[examRecognition] stopRecognition', sessionId);
}
