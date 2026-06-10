"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "page-nav-bar",
  props: {
    title: {
      type: String,
      default: ""
    },
    showBack: {
      type: Boolean,
      default: true
    },
    fallbackUrl: {
      type: String,
      default: "/pages/home/home"
    }
  },
  setup(__props) {
    const props = __props;
    const statusBarHeight = common_vendor.ref(0);
    try {
      statusBarHeight.value = common_vendor.index.getSystemInfoSync().statusBarHeight || 0;
    } catch {
      statusBarHeight.value = 0;
    }
    const TAB_PATHS = /* @__PURE__ */ new Set([
      "/pages/home/home",
      "/pages/my-courses/my-courses",
      "/pages/training-plan/training-plan",
      "/pages/me/me"
    ]);
    function handleBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        common_vendor.index.navigateBack();
        return;
      }
      if (!props.fallbackUrl)
        return;
      const path = props.fallbackUrl.split("?")[0];
      if (TAB_PATHS.has(path)) {
        common_vendor.index.switchTab({ url: path });
        return;
      }
      common_vendor.index.redirectTo({
        url: props.fallbackUrl,
        fail: () => {
          common_vendor.index.navigateBack();
        }
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.showBack
      }, __props.showBack ? {
        b: common_vendor.o(handleBack, "06")
      } : {}, {
        c: common_vendor.t(__props.title),
        d: statusBarHeight.value + "px"
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-869f9292"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/page-nav-bar/page-nav-bar.js.map
