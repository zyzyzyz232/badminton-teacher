"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_page_nav_bar2 = common_vendor.resolveComponent("page-nav-bar");
  _easycom_page_nav_bar2();
}
const _easycom_page_nav_bar = () => "../../components/page-nav-bar/page-nav-bar.js";
if (!Math) {
  _easycom_page_nav_bar();
}
const _sfc_main = {
  __name: "training-plan-arrange",
  setup(__props) {
    common_vendor.onLoad((opt) => {
      const parts = [];
      if (opt && typeof opt === "object") {
        Object.keys(opt).forEach((k) => {
          if (opt[k] != null && opt[k] !== "") {
            parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(opt[k]))}`);
          }
        });
      }
      const query = parts.length ? `?${parts.join("&")}` : "";
      common_vendor.index.redirectTo({
        url: `/pages/training-plan-info/training-plan-info${query}`,
        fail: () => {
          common_vendor.index.showToast({ title: "跳转失败", icon: "none" });
          setTimeout(() => common_vendor.index.navigateBack(), 600);
        }
      });
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          title: "训练计划安排"
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-181a1034"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/training-plan-arrange/training-plan-arrange.js.map
