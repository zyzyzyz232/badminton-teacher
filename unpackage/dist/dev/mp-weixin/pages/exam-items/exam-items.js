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
  __name: "exam-items",
  setup(__props) {
    const examId = common_vendor.ref(0);
    const examTitle = common_vendor.ref("");
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const itemList = common_vendor.ref([]);
    const weightSum = common_vendor.computed(() => services_examApi.calcItemWeightSum(itemList.value));
    function decodeName(raw, fallback = "") {
      if (!raw)
        return fallback;
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    function algoText(t) {
      const n = Number(t);
      if (n === 1)
        return "动作识别";
      if (n === 2)
        return "落点检测";
      return "未设置";
    }
    async function loadItems() {
      if (!examId.value)
        return;
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const data = await services_examApi.fetchExamItemListByExam(examId.value);
        itemList.value = Array.isArray(data) ? data : [];
      } catch (e) {
        itemList.value = [];
        common_vendor.index.showToast({ title: e.message || "加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    function goAdd() {
      const title = encodeURIComponent(examTitle.value || "");
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/exam-item-edit/exam-item-edit?examId=${examId.value}&examTitle=${title}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    }
    function goEdit(item) {
      const id = services_examApi.resolveExamItemId(item);
      if (!id) {
        common_vendor.index.showToast({ title: "考核项编号无效", icon: "none" });
        return;
      }
      const title = encodeURIComponent(examTitle.value || "");
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/exam-item-edit/exam-item-edit?examId=${examId.value}&examItemId=${id}&examTitle=${title}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    }
    function confirmDelete(item) {
      const id = services_examApi.resolveExamItemId(item);
      if (!id)
        return;
      const label = item.itemName || item.name || "该考核项";
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定删除「${label}」吗？`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (!res.confirm)
            return;
          common_vendor.index.showLoading({ title: "删除中..." });
          try {
            await services_examApi.deleteExamItem(id);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            loadItems();
          } catch (e) {
            common_vendor.index.showToast({ title: e.message || "删除失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    }
    function goBackList() {
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateBack({
        fail: () => {
          common_vendor.index.redirectTo({
            url: `/pages/exam-list/exam-list?courseId=${courseId.value}&classId=${classId.value}&className=${name}`
          });
        }
      });
    }
    common_vendor.onLoad((options) => {
      options = options || {};
      examId.value = parseInt(options.examId, 10) || 0;
      examTitle.value = decodeName(options.examTitle, "考核项");
      courseId.value = parseInt(options.courseId, 10) || 0;
      classId.value = parseInt(options.classId, 10) || 0;
      className.value = decodeName(options.className);
    });
    common_vendor.onShow(() => {
      if (examId.value)
        loadItems();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "考核项"
        }),
        b: common_vendor.t(examTitle.value),
        c: common_vendor.t(weightSum.value),
        d: weightSum.value !== 100 && itemList.value.length > 0 ? 1 : "",
        e: common_vendor.o(goAdd, "a4"),
        f: itemList.value.length > 0
      }, itemList.value.length > 0 ? {
        g: common_vendor.f(itemList.value, (item, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.itemName || item.name || "未命名"),
            b: common_vendor.t(algoText(item.algoType)),
            c: common_vendor.t(item.maxScore ?? "-"),
            d: common_vendor.t(item.weight ?? 0),
            e: item.sortOrder != null
          }, item.sortOrder != null ? {
            f: common_vendor.t(item.sortOrder)
          } : {}, {
            g: common_vendor.o(($event) => goEdit(item), common_vendor.unref(services_examApi.resolveExamItemId)(item) || "item-" + idx),
            h: common_vendor.o(($event) => goEdit(item), common_vendor.unref(services_examApi.resolveExamItemId)(item) || "item-" + idx),
            i: common_vendor.o(($event) => confirmDelete(item), common_vendor.unref(services_examApi.resolveExamItemId)(item) || "item-" + idx),
            j: common_vendor.unref(services_examApi.resolveExamItemId)(item) || "item-" + idx
          });
        })
      } : {}, {
        h: common_vendor.o(goBackList, "2a")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-33e7cc48"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-items/exam-items.js.map
