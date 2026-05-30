"use strict";
const common_vendor = require("../common/vendor.js");
const ACTION_RECOGNITION_BASE_URL = "http://10.101.166.129:8000";
const ACTION_RECOGNITION_ANALYZE_PATH = "/api/v1/forehand-clear/analyze-video";
function mapExamTypeToAlgorithm(examType) {
  if (examType === "landing")
    return "landing_detection";
  if (examType === "action_recognition")
    return "action_recognition";
  return "unknown";
}
function parseUploadData(rawData) {
  if (!rawData)
    return {};
  if (typeof rawData === "string") {
    try {
      return JSON.parse(rawData);
    } catch {
      throw new Error("动作识别服务返回数据解析失败");
    }
  }
  if (typeof rawData === "object")
    return rawData;
  throw new Error("动作识别服务返回格式不支持");
}
async function uploadActionRecognitionVideo(filePath) {
  if (!filePath)
    throw new Error("缺少视频文件路径");
  const uploadRes = await common_vendor.index.uploadFile({
    url: `${ACTION_RECOGNITION_BASE_URL}${ACTION_RECOGNITION_ANALYZE_PATH}`,
    filePath,
    name: "file"
  });
  const data = parseUploadData(uploadRes == null ? void 0 : uploadRes.data);
  const requestId = data == null ? void 0 : data.request_id;
  const status = data == null ? void 0 : data.status;
  if (!requestId || !status) {
    throw new Error("动作识别服务返回缺少 request_id 或 status");
  }
  return {
    requestId,
    status,
    resultUrl: (data == null ? void 0 : data.result_url) || ""
  };
}
function bindCameraByVenue(venueId, options = {}) {
  common_vendor.index.__f__("log", "at services/examRecognition.js:58", "[examRecognition] bindCameraByVenue", venueId, options);
  return Promise.resolve({ streamUrl: "", sessionToken: null });
}
async function startRecognition(payload) {
  const { venueId, examType, filePath, ...rest } = payload;
  await bindCameraByVenue(venueId, rest);
  const algorithmKey = mapExamTypeToAlgorithm(examType);
  common_vendor.index.__f__("log", "at services/examRecognition.js:76", "[examRecognition] start algorithm channel", algorithmKey, payload);
  if (examType === "action_recognition") {
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
async function stopRecognition(sessionId) {
  common_vendor.index.__f__("log", "at services/examRecognition.js:96", "[examRecognition] stopRecognition", sessionId);
}
exports.startRecognition = startRecognition;
exports.stopRecognition = stopRecognition;
//# sourceMappingURL=../../.sourcemap/mp-weixin/services/examRecognition.js.map
