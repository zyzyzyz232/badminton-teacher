"use strict";
const common_vendor = require("../common/vendor.js");
const services_trainingPlanApi = require("./trainingPlanApi.js");
const PROFILE_URL = "http://10.112.189.54:48080/admin-api/system/user/profile/get";
function fetchAndStoreUserProfile(token) {
  const authToken = token || common_vendor.index.getStorageSync("token") || "";
  if (!authToken) {
    return Promise.reject(new Error("请先登录"));
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: PROFILE_URL,
      method: "GET",
      header: {
        Authorization: `Bearer ${authToken}`,
        "Tenant-Id": "1"
      },
      success: (res) => {
        var _a, _b;
        if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 0 && res.data.data) {
          common_vendor.index.setStorageSync("userInfo", res.data.data);
          resolve(res.data.data);
          return;
        }
        reject(new Error(((_b = res.data) == null ? void 0 : _b.msg) || "获取用户信息失败"));
      },
      fail: () => reject(new Error("网络连接异常"))
    });
  });
}
async function ensureTeacherSession() {
  const token = common_vendor.index.getStorageSync("token") || "";
  if (!token) {
    throw new Error("请先登录");
  }
  let teacherId = services_trainingPlanApi.getTeacherIdFromStorage();
  if (!teacherId) {
    await fetchAndStoreUserProfile(token);
    teacherId = services_trainingPlanApi.getTeacherIdFromStorage();
  }
  if (!teacherId) {
    throw new Error("无法获取教师账号信息");
  }
  return { token, teacherId };
}
exports.ensureTeacherSession = ensureTeacherSession;
exports.fetchAndStoreUserProfile = fetchAndStoreUserProfile;
//# sourceMappingURL=../../.sourcemap/mp-weixin/services/userProfile.js.map
