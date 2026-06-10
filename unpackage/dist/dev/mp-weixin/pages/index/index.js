"use strict";
const common_vendor = require("../../common/vendor.js");
const services_userProfile = require("../../services/userProfile.js");
if (!Array) {
  const _easycom_page_nav_bar2 = common_vendor.resolveComponent("page-nav-bar");
  _easycom_page_nav_bar2();
}
const _easycom_page_nav_bar = () => "../../components/page-nav-bar/page-nav-bar.js";
if (!Math) {
  _easycom_page_nav_bar();
}
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const isRegister = common_vendor.ref(false);
    const formKey = common_vendor.ref(0);
    const formData = common_vendor.reactive({
      username: "",
      // 账号
      nickname: "",
      // 教师姓名
      mobile: "",
      // 手机号
      password: "",
      confirmPassword: ""
    });
    const handlePasswordInput = (e) => {
      const value = e.detail.value;
      if (value && /^\*+$/.test(value))
        return;
      formData.password = value;
    };
    const handleConfirmPasswordInput = (e) => {
      const value = e.detail.value;
      if (value && /^\*+$/.test(value))
        return;
      formData.confirmPassword = value;
    };
    const toggleMode = () => {
      isRegister.value = !isRegister.value;
      formData.password = "";
      formData.confirmPassword = "";
      formData.username = "";
      formData.nickname = "";
      formData.mobile = "";
      formKey.value++;
    };
    const handleSubmit = () => {
      if (!formData.username) {
        common_vendor.index.showToast({ title: "请输入账号", icon: "none" });
        return;
      }
      if (!formData.password) {
        common_vendor.index.showToast({ title: "请输入密码", icon: "none" });
        return;
      }
      if (isRegister.value) {
        if (!formData.nickname) {
          common_vendor.index.showToast({ title: "请输入教师姓名", icon: "none" });
          return;
        }
        if (!formData.mobile) {
          common_vendor.index.showToast({ title: "请输入手机号", icon: "none" });
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          common_vendor.index.showToast({ title: "两次密码不一致", icon: "none" });
          return;
        }
      }
      common_vendor.index.showLoading({ title: isRegister.value ? "注册中..." : "登录中..." });
      const BASE_URL = "http://10.112.189.54:48080/admin-api/system/auth";
      const requestUrl = isRegister.value ? `${BASE_URL}/teacher-register` : `${BASE_URL}/login`;
      let postData;
      if (isRegister.value) {
        postData = {
          username: formData.username,
          nickname: formData.nickname,
          mobile: formData.mobile,
          password: formData.password
        };
      } else {
        postData = {
          username: formData.username,
          password: formData.password
        };
      }
      common_vendor.index.request({
        url: requestUrl,
        method: "POST",
        header: {
          "content-type": "application/json",
          "Tenant-Id": "1"
        },
        data: postData,
        success: (res) => {
          var _a;
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("log", "at pages/index/index.vue:208", "后端返回:", res.data);
          if (res.data.code === 0) {
            common_vendor.index.showToast({ title: isRegister.value ? "注册成功" : "登录成功" });
            const accessToken = (_a = res.data.data) == null ? void 0 : _a.accessToken;
            if (accessToken) {
              common_vendor.index.setStorageSync("token", accessToken);
              services_userProfile.fetchAndStoreUserProfile(accessToken).then(() => {
                setTimeout(() => {
                  common_vendor.index.switchTab({ url: "/pages/home/home" });
                }, 400);
              }).catch((err) => {
                common_vendor.index.__f__("error", "at pages/index/index.vue:223", err);
                common_vendor.index.showToast({
                  title: (err == null ? void 0 : err.message) || "获取用户信息失败",
                  icon: "none"
                });
              });
            } else if (!isRegister.value) {
              common_vendor.index.showToast({ title: "登录响应缺少令牌", icon: "none" });
            }
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "操作失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/index/index.vue:239", "请求失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const handleWechatLogin = () => {
      common_vendor.index.login({
        provider: "weixin",
        success: (res) => {
          common_vendor.index.showToast({ title: "微信授权成功", icon: "success" });
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "登录注册",
          ["show-back"]: false
        }),
        b: common_vendor.t(isRegister.value ? "加入我们，开启训练" : "欢迎回来，继续挥拍"),
        c: common_vendor.t(isRegister.value ? "注册账号" : "账号登录"),
        d: isRegister.value
      }, isRegister.value ? {
        e: formData.nickname,
        f: common_vendor.o(($event) => formData.nickname = $event.detail.value, "e5")
      } : {}, {
        g: isRegister.value
      }, isRegister.value ? {
        h: formData.mobile,
        i: common_vendor.o(($event) => formData.mobile = $event.detail.value, "b7")
      } : {}, {
        j: formData.username,
        k: common_vendor.o(($event) => formData.username = $event.detail.value, "5b"),
        l: "password-" + formKey.value,
        m: common_vendor.o(handlePasswordInput, "6a"),
        n: isRegister.value
      }, isRegister.value ? {
        o: "confirm-" + formKey.value,
        p: common_vendor.o(handleConfirmPasswordInput, "2f")
      } : {}, {
        q: common_vendor.t(isRegister.value ? "立即注册" : "登 录"),
        r: common_vendor.o(handleSubmit, "fa"),
        s: common_vendor.t(isRegister.value ? "已有账号？" : "还没有账号？"),
        t: common_vendor.t(isRegister.value ? "去登录" : "立即注册"),
        v: common_vendor.o(toggleMode, "a8"),
        w: common_vendor.o(handleWechatLogin, "e5")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
