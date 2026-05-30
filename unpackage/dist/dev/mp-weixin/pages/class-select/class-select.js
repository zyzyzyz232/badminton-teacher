"use strict";
const common_vendor = require("../../common/vendor.js");
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "class-select",
  setup(__props) {
    const courseId = common_vendor.reactive({ value: 0 });
    const courseName = common_vendor.reactive({ value: "" });
    const classList = common_vendor.reactive([]);
    const getClassList = () => {
      if (!courseId.value) {
        common_vendor.index.showToast({ title: "课程ID无效", icon: "none" });
        return;
      }
      const token = common_vendor.index.getStorageSync("token");
      common_vendor.index.showLoading({ title: "加载中..." });
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/list-classes`,
        method: "GET",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        data: {
          courseId: courseId.value
        },
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.data.code === 0 && res.data.data) {
            classList.length = 0;
            classList.push(...res.data.data);
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "获取班级失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/class-select/class-select.vue:92", "请求失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const goToClassDetail = (item) => {
      common_vendor.index.navigateTo({
        url: `/pages/class-detail/class-detail?courseId=${courseId.value}&classId=${item.classId}&className=${item.className}`
      });
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      courseId.value = parseInt(options.courseId) || 0;
      courseName.value = options.courseName || "课程详情";
      common_vendor.index.setNavigationBarTitle({
        title: courseName.value
      });
      getClassList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(courseName),
        b: classList.length > 0
      }, classList.length > 0 ? {
        c: common_vendor.f(classList, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.className || "默认班级"),
            b: common_vendor.t(item.studentCount || 0),
            c: item.classId,
            d: common_vendor.o(($event) => goToClassDetail(item), item.classId)
          };
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5fee218d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/class-select/class-select.js.map
