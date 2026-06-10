"use strict";
const common_vendor = require("../../common/vendor.js");
const services_trainingPlanApi = require("../../services/trainingPlanApi.js");
if (!Array) {
  const _easycom_page_nav_bar2 = common_vendor.resolveComponent("page-nav-bar");
  _easycom_page_nav_bar2();
}
const _easycom_page_nav_bar = () => "../../components/page-nav-bar/page-nav-bar.js";
if (!Math) {
  _easycom_page_nav_bar();
}
const _sfc_main = {
  __name: "training-plan",
  setup(__props) {
    const planList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    async function refresh() {
      loading.value = true;
      try {
        const list = await services_trainingPlanApi.fetchTrainingPlanList();
        planList.value = Array.isArray(list) ? list : [];
      } catch (e) {
        planList.value = [];
        common_vendor.index.__f__("warn", "at pages/training-plan/training-plan.vue:52", "fetchTrainingPlanList", e);
      } finally {
        loading.value = false;
      }
    }
    function openArrange(planId) {
      common_vendor.index.navigateTo({
        url: `/pages/training-plan-info/training-plan-info?planId=${encodeURIComponent(planId)}`
      });
    }
    function confirmDeletePlan(plan) {
      if (!plan || plan.id == null)
        return;
      const pid = parseInt(String(plan.id), 10);
      if (!Number.isFinite(pid) || pid <= 0)
        return;
      const title = (plan.title || "").trim() || "该训练计划";
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除「${title}」吗？删除后无法恢复。`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            common_vendor.index.showLoading({ title: "删除中…" });
            await services_trainingPlanApi.deleteTeachingPlan(pid);
            planList.value = planList.value.filter((x) => String(x.id) !== String(plan.id));
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          } catch (e) {
            common_vendor.index.showToast({ title: e && e.message || "删除失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    }
    function openNewArrange() {
      common_vendor.index.navigateTo({
        url: "/pages/training-plan-info/training-plan-info?mode=new"
      });
    }
    common_vendor.onShow(() => {
      refresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "训练计划",
          ["show-back"]: false
        }),
        b: common_vendor.f(planList.value, (plan, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(plan.title),
            b: common_vendor.o(($event) => confirmDeletePlan(plan), plan.id),
            c: common_vendor.o(() => {
            }, plan.id),
            d: plan.subtitle
          }, plan.subtitle ? {
            e: common_vendor.t(plan.subtitle)
          } : {}, {
            f: plan.id,
            g: common_vendor.o(($event) => openArrange(plan.id), plan.id)
          });
        }),
        c: !loading.value && planList.value.length === 0
      }, !loading.value && planList.value.length === 0 ? {} : {}, {
        d: common_vendor.o(openNewArrange, "1d")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-be437309"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/training-plan/training-plan.js.map
