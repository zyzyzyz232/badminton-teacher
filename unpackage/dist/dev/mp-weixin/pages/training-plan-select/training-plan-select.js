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
  __name: "training-plan-select",
  setup(__props) {
    const lessonId = common_vendor.ref(0);
    const courseId = common_vendor.ref(0);
    const lessonName = common_vendor.ref("");
    const courseName = common_vendor.ref("");
    const planList = common_vendor.ref([]);
    const planProjects = common_vendor.ref({});
    const selectedPlanId = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const fetchPlanList = async () => {
      const tid = services_trainingPlanApi.getTeacherIdFromStorage();
      if (!tid) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      if (!lessonId.value) {
        common_vendor.index.showToast({ title: "课堂ID无效", icon: "none" });
        return;
      }
      loading.value = true;
      try {
        const list = await services_trainingPlanApi.fetchPlanListByTeacher(tid);
        planList.value = list || [];
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/training-plan-select/training-plan-select.vue:129", "请求失败:", err);
        planList.value = [];
        common_vendor.index.showToast({
          title: err && err.message || "获取训练计划列表失败",
          icon: "none",
          duration: 2500
        });
      } finally {
        loading.value = false;
      }
    };
    const fetchPlanProjects = (planId) => {
      if (planProjects.value[planId])
        return;
      services_trainingPlanApi.fetchPlanProjectsByPlan(planId).then((list) => {
        planProjects.value[planId] = list || [];
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/training-plan-select/training-plan-select.vue:150", "获取训练项目失败:", err);
        planProjects.value[planId] = [];
      });
    };
    const goEditPlan = (plan) => {
      if (!plan || plan.id == null)
        return;
      const q = [
        `planId=${encodeURIComponent(plan.id)}`,
        `lessonId=${encodeURIComponent(lessonId.value)}`,
        `courseId=${encodeURIComponent(courseId.value || "")}`,
        `lessonName=${encodeURIComponent(lessonName.value || "")}`,
        `courseName=${encodeURIComponent(courseName.value || "")}`
      ].join("&");
      common_vendor.index.navigateTo({
        url: `/pages/training-plan-info/training-plan-info?${q}`,
        fail: (e) => {
          common_vendor.index.__f__("error", "at pages/training-plan-select/training-plan-select.vue:168", e);
          common_vendor.index.showToast({ title: "跳转失败", icon: "none" });
        }
      });
    };
    const selectPlan = (plan) => {
      selectedPlanId.value = plan.id;
      fetchPlanProjects(plan.id);
    };
    function goAfterPlanBound() {
      const selectedPlan = planList.value.find((p) => p.id === selectedPlanId.value);
      const q = [
        `lessonId=${lessonId.value}`,
        `planId=${selectedPlanId.value}`,
        `planTitle=${encodeURIComponent(selectedPlan && selectedPlan.planTitle || "")}`,
        `lessonName=${encodeURIComponent(lessonName.value || "")}`,
        `courseName=${encodeURIComponent(courseName.value || "")}`
      ].join("&");
      common_vendor.index.navigateTo({
        url: `/pages/screen-control/screen-control?${q}`,
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/training-plan-select/training-plan-select.vue:193", err);
          common_vendor.index.showToast({ title: "跳转失败", icon: "none" });
        }
      });
    }
    const confirmPlan = () => {
      if (!selectedPlanId.value)
        return;
      const selectedPlan = planList.value.find((p) => p.id === selectedPlanId.value);
      common_vendor.index.showModal({
        title: "确认选择",
        content: `确定要选择「${selectedPlan.planTitle}」吗？`,
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            common_vendor.index.showLoading({ title: "绑定课堂…" });
            await services_trainingPlanApi.bindPlanToCurrentLesson({
              planId: selectedPlanId.value,
              lessonId: lessonId.value,
              courseId: courseId.value || void 0
            });
            common_vendor.index.hideLoading();
            goAfterPlanBound();
          } catch (err) {
            common_vendor.index.hideLoading();
            common_vendor.index.__f__("error", "at pages/training-plan-select/training-plan-select.vue:220", err);
            common_vendor.index.showToast({
              title: err && err.message || "绑定课堂失败",
              icon: "none",
              duration: 2500
            });
          }
        }
      });
    };
    const getItemTypeText = (type) => {
      const types = { 1: "基础训练", 2: "强化训练", 3: "考核项目" };
      return types[type] || "未知";
    };
    const getDifficultyText = (difficulty) => {
      const texts = { 1: "简单", 2: "中等", 3: "困难" };
      return texts[difficulty] || "未知";
    };
    common_vendor.onShow(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options || {};
      lessonId.value = parseInt(options.lessonId) || 0;
      courseId.value = parseInt(options.courseId) || 0;
      lessonName.value = options.lessonName || "";
      try {
        courseName.value = options.courseName ? decodeURIComponent(options.courseName) : "";
      } catch {
        courseName.value = options.courseName || "";
      }
      common_vendor.index.setNavigationBarTitle({
        title: "选择训练计划"
      });
      planProjects.value = {};
      selectedPlanId.value = null;
      fetchPlanList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "选择训练计划"
        }),
        b: common_vendor.t(courseName.value),
        c: common_vendor.t(lessonName.value),
        d: planList.value.length > 0
      }, planList.value.length > 0 ? {
        e: common_vendor.f(planList.value, (plan, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(plan.planTitle),
            b: common_vendor.t(plan.planTypeText),
            c: common_vendor.n("type-" + plan.planType),
            d: common_vendor.t(plan.difficultyText),
            e: common_vendor.n("difficulty-" + plan.difficulty),
            f: common_vendor.t(plan.duration),
            g: common_vendor.t(plan.statusText),
            h: common_vendor.n("status-" + plan.status),
            i: plan.planContent
          }, plan.planContent ? {
            j: common_vendor.t(plan.planContent)
          } : {}, {
            k: common_vendor.o(($event) => goEditPlan(plan), plan.id),
            l: common_vendor.o(() => {
            }, plan.id),
            m: selectedPlanId.value === plan.id && planProjects.value[plan.id]
          }, selectedPlanId.value === plan.id && planProjects.value[plan.id] ? {
            n: common_vendor.f(planProjects.value[plan.id], (project, k1, i1) => {
              return {
                a: common_vendor.t(project.itemName),
                b: common_vendor.t(getItemTypeText(project.itemType)),
                c: common_vendor.n("item-type-" + project.itemType),
                d: common_vendor.t(project.duration),
                e: common_vendor.t(project.score),
                f: common_vendor.t(getDifficultyText(project.difficulty)),
                g: common_vendor.n("difficulty-" + project.difficulty),
                h: project.id
              };
            })
          } : {}, {
            o: plan.id,
            p: selectedPlanId.value === plan.id ? 1 : "",
            q: common_vendor.o(($event) => selectPlan(plan), plan.id)
          });
        })
      } : !loading.value ? {} : {}, {
        f: !loading.value,
        g: planList.value.length > 0
      }, planList.value.length > 0 ? {
        h: common_vendor.t(selectedPlanId.value ? "确认并开始训练" : "请选择训练计划"),
        i: !selectedPlanId.value,
        j: common_vendor.o(confirmPlan, "c2")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-06194000"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/training-plan-select/training-plan-select.js.map
