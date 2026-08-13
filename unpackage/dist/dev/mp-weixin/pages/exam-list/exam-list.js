"use strict";
const common_vendor = require("../../common/vendor.js");
const services_examApi = require("../../services/examApi.js");
if (!Array) {
  const _easycom_page_nav_bar2 = common_vendor.resolveComponent("page-nav-bar");
  _easycom_page_nav_bar2();
}
const _easycom_page_nav_bar = () => "../../components/page-nav-bar/page-nav-bar.js";
if (!Math) {
  _easycom_page_nav_bar();
}
const _sfc_main = {
  __name: "exam-list",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const examList = common_vendor.ref([]);
    const usage = common_vendor.computed(() => services_examApi.calcScoreRatioUsage(examList.value));
    const usedRatio = common_vendor.computed(() => usage.value.used);
    const remainingRatio = common_vendor.computed(() => usage.value.remaining);
    function decodeName(raw) {
      if (!raw)
        return "考试列表";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    function statusText(status) {
      const map = { 0: "配置中", 1: "可开考", 2: "进行中", 3: "已结束" };
      return map[status] || "配置中";
    }
    async function loadList() {
      if (!courseId.value)
        return;
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const data = await services_examApi.fetchExamListByCourse(courseId.value);
        examList.value = Array.isArray(data) ? data : [];
      } catch (e) {
        examList.value = [];
        common_vendor.index.showToast({ title: e.message || "加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    function goCreate() {
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/exam-create/exam-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    }
    function goEdit(item) {
      const id = services_examApi.resolveExamId(item);
      if (!id) {
        common_vendor.index.showToast({ title: "考试编号无效", icon: "none" });
        return;
      }
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/exam-create/exam-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}&examId=${id}`
      });
    }
    function goItems(item) {
      const id = services_examApi.resolveExamId(item);
      if (!id) {
        common_vendor.index.showToast({ title: "考试编号无效", icon: "none" });
        return;
      }
      const title = encodeURIComponent(item.title || "考核项");
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/exam-items/exam-items?examId=${id}&examTitle=${title}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    }
    async function enterExamRoom(item) {
      const id = services_examApi.resolveExamId(item);
      if (!id) {
        common_vendor.index.showToast({ title: "考试编号无效", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "校验配置..." });
      try {
        const result = await services_examApi.validateExamReadyForRoom(id);
        common_vendor.index.hideLoading();
        if (!result.ok) {
          common_vendor.index.showToast({ title: result.reason || "配置未完成", icon: "none", duration: 2500 });
          return;
        }
        common_vendor.index.showToast({ title: "考场功能将在阶段二开放", icon: "none", duration: 2500 });
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: e.message || "校验失败", icon: "none" });
      }
    }
    function confirmDelete(item) {
      const id = services_examApi.resolveExamId(item);
      if (!id)
        return;
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定删除「${item.title || "该考试"}」吗？`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (!res.confirm)
            return;
          common_vendor.index.showLoading({ title: "删除中..." });
          try {
            await services_examApi.deleteExam(id);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            loadList();
          } catch (e) {
            common_vendor.index.showToast({ title: e.message || "删除失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    }
    common_vendor.onLoad((options) => {
      options = options || {};
      courseId.value = parseInt(options.courseId, 10) || 0;
      classId.value = parseInt(options.classId, 10) || 0;
      className.value = decodeName(options.className);
    });
    common_vendor.onShow(() => {
      if (courseId.value)
        loadList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "考试列表"
        }),
        b: common_vendor.t(className.value),
        c: common_vendor.t(usedRatio.value),
        d: common_vendor.t(remainingRatio.value),
        e: common_vendor.o(goCreate, "ae"),
        f: examList.value.length > 0
      }, examList.value.length > 0 ? {
        g: common_vendor.f(examList.value, (item, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.title || "未命名考试"),
            b: common_vendor.t(statusText(item.status)),
            c: common_vendor.n("st-" + (item.status ?? 0)),
            d: common_vendor.t(item.scoreRatio ?? 0),
            e: item.weekIndex != null
          }, item.weekIndex != null ? {
            f: common_vendor.t(item.weekIndex)
          } : item.lessonWeekIndex != null ? {
            h: common_vendor.t(item.lessonWeekIndex)
          } : {}, {
            g: item.lessonWeekIndex != null,
            i: common_vendor.o(($event) => goEdit(item), common_vendor.unref(services_examApi.resolveExamId)(item) || "exam-" + idx),
            j: common_vendor.o(($event) => goItems(item), common_vendor.unref(services_examApi.resolveExamId)(item) || "exam-" + idx),
            k: common_vendor.o(($event) => enterExamRoom(item), common_vendor.unref(services_examApi.resolveExamId)(item) || "exam-" + idx),
            l: common_vendor.o(($event) => confirmDelete(item), common_vendor.unref(services_examApi.resolveExamId)(item) || "exam-" + idx),
            m: common_vendor.unref(services_examApi.resolveExamId)(item) || "exam-" + idx
          });
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6b8bcde8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-list/exam-list.js.map
