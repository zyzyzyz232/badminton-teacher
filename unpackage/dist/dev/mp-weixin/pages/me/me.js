"use strict";
const common_vendor = require("../../common/vendor.js");
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "me",
  setup(__props) {
    const userInfo = common_vendor.reactive({
      id: 0,
      username: "",
      nickname: "",
      avatar: "",
      mobile: "",
      email: "",
      sex: 0,
      dept: null,
      roles: [],
      posts: [],
      loginIp: "",
      loginDate: "",
      createTime: ""
    });
    const sexText = common_vendor.computed(() => {
      const map = { 0: "保密", 1: "男", 2: "女" };
      return map[userInfo.sex] || "保密";
    });
    const rolesText = common_vendor.computed(() => {
      if (!userInfo.roles || userInfo.roles.length === 0)
        return "--";
      return userInfo.roles.map((r) => r.name).join("、");
    });
    const postsText = common_vendor.computed(() => {
      if (!userInfo.posts || userInfo.posts.length === 0)
        return "--";
      return userInfo.posts.map((p) => p.name).join("、");
    });
    const formatTime = (timeStr) => {
      if (!timeStr)
        return "--";
      const date = new Date(timeStr);
      if (isNaN(date.getTime()))
        return timeStr;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    common_vendor.onShow(() => {
      getUserProfile();
    });
    const getUserProfile = () => {
      const token = common_vendor.index.getStorageSync("token");
      if (!token) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      common_vendor.index.request({
        url: `${BASE_URL}/system/user/profile/get`,
        method: "GET",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        success: (res) => {
          if (res.data.code === 0 && res.data.data) {
            Object.assign(userInfo, res.data.data);
            common_vendor.index.setStorageSync("userInfo", res.data.data);
            common_vendor.index.__f__("log", "at pages/me/me.vue:181", "用户信息已获取:", res.data.data);
          } else {
            common_vendor.index.__f__("error", "at pages/me/me.vue:183", "获取用户信息失败:", res);
            common_vendor.index.showToast({ title: res.data.msg || "获取信息失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/me/me.vue:188", "请求失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const showDevTip = () => {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    };
    const handleLogout = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("token");
            common_vendor.index.removeStorageSync("userInfo");
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }
        }
      });
    };
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: userInfo.avatar
      }, userInfo.avatar ? {
        b: userInfo.avatar
      } : {}, {
        c: common_vendor.t(userInfo.nickname || "教师"),
        d: common_vendor.t(userInfo.username || "--"),
        e: common_vendor.t(userInfo.nickname || "--"),
        f: common_vendor.t(sexText.value),
        g: common_vendor.t(userInfo.mobile || "--"),
        h: common_vendor.t(userInfo.email || "--"),
        i: common_vendor.t(((_a = userInfo.dept) == null ? void 0 : _a.name) || "--"),
        j: common_vendor.t(rolesText.value),
        k: common_vendor.t(postsText.value),
        l: common_vendor.o(showDevTip, "bb"),
        m: common_vendor.t(userInfo.id || "--"),
        n: common_vendor.t(userInfo.loginIp || "--"),
        o: common_vendor.t(formatTime(userInfo.loginDate)),
        p: common_vendor.t(formatTime(userInfo.createTime)),
        q: common_vendor.o(showDevTip, "e5"),
        r: common_vendor.o(handleLogout, "36")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-19c123a7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/me/me.js.map
