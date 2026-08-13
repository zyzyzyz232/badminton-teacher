"use strict";
const common_vendor = require("../common/vendor.js");
const LIVE_API_BASE = "http://10.112.189.54:48080/admin-api";
const TEACHING_API_BASE = "http://10.29.108.157:48081/admin-api";
function getToken() {
  return common_vendor.index.getStorageSync("token") || "";
}
function authHeaders(json = false) {
  const h = {
    Authorization: `Bearer ${getToken()}`,
    "Tenant-Id": "1"
  };
  if (json)
    h["Content-Type"] = "application/json";
  return h;
}
function formatExamApiError(d) {
  if (!d || typeof d !== "object")
    return "请求失败";
  const msg = d.msg || `请求失败(${d.code})`;
  const lower = String(msg).toLowerCase();
  if (d.code === "exam_ratio_exceeded" || lower.includes("exam_ratio_exceeded") || typeof msg === "string" && msg.includes("剩余")) {
    return msg;
  }
  return msg;
}
function teachingJsonRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${TEACHING_API_BASE}${path}`,
      method,
      header: authHeaders(true),
      data: data || {},
      success: (res) => {
        const d = res.data;
        if (d == null) {
          reject(new Error("空响应"));
          return;
        }
        if (typeof d.code === "number") {
          if (d.code === 0) {
            resolve(d.data !== void 0 ? d.data : null);
          } else {
            reject(new Error(formatExamApiError(d)));
          }
          return;
        }
        resolve(d);
      },
      fail: (err) => {
        const msg = err && (err.errMsg || err.message) || (typeof err === "string" ? err : "网络错误");
        reject(new Error(msg));
      }
    });
  });
}
function teachingGet(path, query, apiBase = TEACHING_API_BASE) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${apiBase}${path}`,
      method: "GET",
      header: authHeaders(),
      data: query || {},
      success: (res) => {
        const d = res.data;
        if (d == null) {
          reject(new Error("空响应"));
          return;
        }
        if (typeof d.code === "number") {
          if (d.code === 0) {
            resolve(d.data !== void 0 ? d.data : null);
          } else {
            reject(new Error(formatExamApiError(d)));
          }
          return;
        }
        resolve(d);
      },
      fail: (err) => {
        const msg = err && (err.errMsg || err.message) || (typeof err === "string" ? err : "网络错误");
        reject(new Error(msg));
      }
    });
  });
}
function teachingDelete(pathWithQuery) {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${TEACHING_API_BASE}${pathWithQuery}`,
      method: "DELETE",
      header: authHeaders(),
      success: (res) => {
        const d = res.data;
        if (d == null) {
          reject(new Error("空响应"));
          return;
        }
        if (typeof d.code === "number") {
          if (d.code === 0) {
            resolve(d.data !== void 0 ? d.data : null);
          } else {
            reject(new Error(formatExamApiError(d)));
          }
          return;
        }
        resolve(d);
      },
      fail: (err) => {
        const msg = err && (err.errMsg || err.message) || (typeof err === "string" ? err : "网络错误");
        reject(new Error(msg));
      }
    });
  });
}
function normalizeCreateLongId(data) {
  if (data == null)
    return null;
  if (typeof data === "number" && Number.isFinite(data))
    return data;
  if (typeof data === "string") {
    const n = parseInt(data, 10);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof data === "object") {
    const id = data.id ?? data.examId ?? data.itemId;
    if (id == null)
      return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function resolveExamId(row) {
  if (!row)
    return 0;
  const v = row.id ?? row.examId;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
}
function resolveLessonId(row) {
  if (!row)
    return 0;
  const v = row.id ?? row.lessonId;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
}
function resolveExamItemId(row) {
  if (!row)
    return 0;
  const v = row.id ?? row.itemId ?? row.examItemId;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
}
function calcScoreRatioUsage(examList, excludeExamId = 0) {
  const list = Array.isArray(examList) ? examList : [];
  let used = 0;
  for (const row of list) {
    const id = resolveExamId(row);
    if (excludeExamId && id === excludeExamId)
      continue;
    const r = Number(row.scoreRatio ?? row.score_ratio ?? 0);
    if (Number.isFinite(r) && r > 0)
      used += r;
  }
  if (used < 0)
    used = 0;
  if (used > 100)
    used = 100;
  return { used, remaining: Math.max(0, 100 - used) };
}
function calcItemWeightSum(items, excludeItemId = 0) {
  const list = Array.isArray(items) ? items : [];
  let sum = 0;
  for (const row of list) {
    const id = resolveExamItemId(row);
    if (excludeItemId && id === excludeItemId)
      continue;
    const w = Number(row.weight ?? 0);
    if (Number.isFinite(w) && w > 0)
      sum += w;
  }
  return sum;
}
function fetchExamListByCourse(courseId) {
  return teachingGet("/teaching/exam/list-by-course", { courseId });
}
function fetchExamGet(id) {
  return teachingGet("/teaching/exam/get", { id });
}
function createExam(body) {
  return teachingJsonRequest("POST", "/teaching/exam/create", body);
}
function updateExam(body) {
  return teachingJsonRequest("PUT", "/teaching/exam/update", body);
}
function deleteExam(id) {
  return teachingDelete(`/teaching/exam/delete?id=${id}`);
}
function fetchExamItemListByExam(examId) {
  return teachingGet("/teaching/exam-item/list-by-exam", { examId });
}
function fetchExamItemGet(id) {
  return teachingGet("/teaching/exam-item/get", { id });
}
function createExamItem(body) {
  return teachingJsonRequest("POST", "/teaching/exam-item/create", body);
}
function updateExamItem(body) {
  return teachingJsonRequest("PUT", "/teaching/exam-item/update", body);
}
function deleteExamItem(id) {
  return teachingDelete(`/teaching/exam-item/delete?id=${id}`);
}
function fetchExamItemMaterialList(examItemId) {
  return teachingGet("/teaching/exam-item-material/list-by-item", {
    examItemId
  });
}
function createExamItemMaterial(body) {
  return teachingJsonRequest("POST", "/teaching/exam-item-material/create", body);
}
function deleteExamItemMaterial(id) {
  return teachingDelete(`/teaching/exam-item-material/delete?id=${id}`);
}
function asList(data) {
  if (Array.isArray(data))
    return data;
  if (data && Array.isArray(data.list))
    return data.list;
  return [];
}
function toMaterialUrls(row, materialType) {
  const type = Number(materialType) || 1;
  if (typeof row === "string" && row) {
    return {
      url: row,
      imageUrl: type === 1 ? row : "",
      videoUrl: type === 2 ? row : ""
    };
  }
  if (!row || typeof row !== "object")
    return null;
  const url = row.url || row.fileUrl || (type === 2 ? row.videoUrl : row.imageUrl) || "";
  if (!url && !row.imageUrl && !row.videoUrl)
    return null;
  return {
    url,
    imageUrl: row.imageUrl || (type === 1 ? url : ""),
    videoUrl: row.videoUrl || (type === 2 ? url : ""),
    duration: row.duration,
    title: row.title,
    description: row.description,
    sort: row.sort ?? row.sortOrder
  };
}
function parseUploadResponse(res) {
  const raw = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  if (raw && typeof raw.code === "number" && raw.code !== 0) {
    throw new Error(formatExamApiError(raw));
  }
  return raw && raw.data !== void 0 ? raw.data : raw;
}
function uniUploadFile(url, filePath, formData) {
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url,
      filePath,
      name: "file",
      header: authHeaders(),
      formData,
      success: (res) => {
        try {
          resolve(parseUploadResponse(res));
        } catch (e) {
          reject(e instanceof Error ? e : new Error("解析上传结果失败"));
        }
      },
      fail: (err) => {
        const msg = err && (err.errMsg || err.message) || (typeof err === "string" ? err : "网络错误");
        reject(new Error(msg));
      }
    });
  });
}
async function uploadExamFileViaLiveTeaching(opts) {
  const { filePath, examItemId, materialType, title = "", description = "" } = opts;
  const type = Number(materialType) || 1;
  const formData = {
    itemId: String(examItemId),
    materialType: String(type),
    title: title || "",
    description: description || ""
  };
  const data = await uniUploadFile(
    `${LIVE_API_BASE}/teaching/plan-material/upload`,
    filePath,
    formData
  );
  let row = data;
  if (typeof row === "number" || typeof row === "string" && /^\d+$/.test(row)) {
    try {
      row = await teachingGet(
        "/teaching/plan-material/get",
        { id: row },
        LIVE_API_BASE
      );
    } catch (e) {
      row = null;
    }
  }
  let parsed = toMaterialUrls(row, type);
  if (!parsed) {
    const list = asList(
      await teachingGet(
        "/teaching/plan-material/list-by-item",
        { itemId: examItemId },
        LIVE_API_BASE
      )
    );
    const newest = list.slice().sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
    parsed = toMaterialUrls(newest, type);
  }
  if (!parsed) {
    throw new Error("上传成功但未返回文件地址");
  }
  return parsed;
}
async function uploadExamFileViaSidecar(opts) {
  const { filePath, materialType } = opts;
  const type = Number(materialType) || 1;
  const data = await uniUploadFile(
    `${TEACHING_API_BASE}/teaching/exam-item-material/upload`,
    filePath,
    { materialType: String(type) }
  );
  const parsed = toMaterialUrls(data, type);
  if (!parsed) {
    throw new Error("上传成功但未返回文件地址");
  }
  return parsed;
}
async function uploadExamItemMaterialFile(opts) {
  try {
    return await uploadExamFileViaLiveTeaching(opts);
  } catch (liveErr) {
    try {
      return await uploadExamFileViaSidecar(opts);
    } catch (sidecarErr) {
      const liveMsg = liveErr instanceof Error ? liveErr.message : String(liveErr);
      const sideMsg = sidecarErr instanceof Error ? sidecarErr.message : String(sidecarErr);
      throw new Error(sideMsg && sideMsg !== liveMsg ? sideMsg : liveMsg);
    }
  }
}
async function uploadAndCreateExamItemMaterial(opts) {
  const uploaded = await uploadExamItemMaterialFile(opts);
  const materialType = Number(opts.materialType) || 1;
  const imageUrl = uploaded.imageUrl || (materialType === 1 ? uploaded.url || uploaded.fileUrl || "" : "") || "";
  const videoUrl = uploaded.videoUrl || (materialType === 2 ? uploaded.url || uploaded.fileUrl || "" : "") || "";
  const body = {
    examItemId: Number(opts.examItemId),
    materialType,
    imageUrl: imageUrl || uploaded.imageUrl || "",
    videoUrl: videoUrl || uploaded.videoUrl || "",
    duration: uploaded.duration != null ? uploaded.duration : void 0,
    title: opts.title || uploaded.title || "",
    description: opts.description || uploaded.description || "",
    sort: uploaded.sort ?? uploaded.sortOrder ?? 0
  };
  const created = await createExamItemMaterial(body);
  return { uploaded, created, materialId: normalizeCreateLongId(created) };
}
async function fetchLessonsByCourse(courseId, opts = {}) {
  const data = await teachingGet(
    "/teaching/course/list-lessons",
    { courseId },
    LIVE_API_BASE
  );
  const list = Array.isArray(data) ? data : [];
  const typeFilter = opts.type;
  if (typeFilter == null)
    return list;
  return list.filter((row) => {
    const t = Number(row.type ?? row.lessonType);
    return t === Number(typeFilter);
  });
}
async function validateExamReadyForRoom(examId) {
  const itemsRaw = await fetchExamItemListByExam(examId);
  const items = Array.isArray(itemsRaw) ? itemsRaw : [];
  if (items.length < 1) {
    return { ok: false, reason: "请至少配置 1 个考核项", items };
  }
  const weightSum = calcItemWeightSum(items);
  if (weightSum !== 100) {
    return {
      ok: false,
      reason: `考核项权重之和应为 100%（当前 ${weightSum}%）`,
      items
    };
  }
  return { ok: true, items };
}
exports.calcItemWeightSum = calcItemWeightSum;
exports.calcScoreRatioUsage = calcScoreRatioUsage;
exports.createExam = createExam;
exports.createExamItem = createExamItem;
exports.deleteExam = deleteExam;
exports.deleteExamItem = deleteExamItem;
exports.deleteExamItemMaterial = deleteExamItemMaterial;
exports.fetchExamGet = fetchExamGet;
exports.fetchExamItemGet = fetchExamItemGet;
exports.fetchExamItemListByExam = fetchExamItemListByExam;
exports.fetchExamItemMaterialList = fetchExamItemMaterialList;
exports.fetchExamListByCourse = fetchExamListByCourse;
exports.fetchLessonsByCourse = fetchLessonsByCourse;
exports.normalizeCreateLongId = normalizeCreateLongId;
exports.resolveExamId = resolveExamId;
exports.resolveExamItemId = resolveExamItemId;
exports.resolveLessonId = resolveLessonId;
exports.updateExam = updateExam;
exports.updateExamItem = updateExamItem;
exports.uploadAndCreateExamItemMaterial = uploadAndCreateExamItemMaterial;
exports.validateExamReadyForRoom = validateExamReadyForRoom;
//# sourceMappingURL=../../.sourcemap/mp-weixin/services/examApi.js.map
