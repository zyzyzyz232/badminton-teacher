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
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "lesson-list",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const lessonList = common_vendor.ref([]);
    const forExam = common_vendor.ref(false);
    const getToken = () => {
      return common_vendor.index.getStorageSync("token") || "";
    };
    const getLessonList = () => {
      if (!courseId.value) {
        common_vendor.index.showToast({ title: "课程ID无效", icon: "none" });
        return;
      }
      const token = getToken();
      common_vendor.index.showLoading({ title: "加载中..." });
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/list-lessons`,
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
            lessonList.value = res.data.data;
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "获取课堂失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/lesson-list/lesson-list.vue:129", "请求失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    function resolveLessonRowId(item) {
      const v = (item == null ? void 0 : item.id) ?? (item == null ? void 0 : item.lessonId);
      if (v === void 0 || v === null || v === "")
        return 0;
      const n = typeof v === "number" ? v : parseInt(String(v), 10);
      return Number.isFinite(n) ? n : 0;
    }
    const goToCreateLesson = () => {
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/lesson-create/lesson-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    };
    const deleteLesson = (item) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除「第${item.weekIndex}周」的课堂吗？
此操作不可恢复！`,
        confirmColor: "#ff4d4f",
        success: (res) => {
          if (res.confirm) {
            doDeleteLesson(resolveLessonRowId(item));
          }
        }
      });
    };
    const doDeleteLesson = (lessonId) => {
      const token = getToken();
      common_vendor.index.showLoading({ title: "删除中..." });
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/lesson/delete?id=${lessonId}`,
        method: "DELETE",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.data.code === 0) {
            common_vendor.index.showToast({ title: "删除成功", icon: "success" });
            getLessonList();
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "删除失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/lesson-list/lesson-list.vue:189", "删除失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const goToExamSetupForLesson = (item) => {
      const lid = resolveLessonRowId(item);
      if (!lid) {
        common_vendor.index.showToast({ title: "课堂数据缺少编号", icon: "none" });
        return;
      }
      const name = encodeURIComponent(className.value || "");
      const wid = item.weekIndex != null ? item.weekIndex : 0;
      common_vendor.index.navigateTo({
        url: `/pages/exam-setup/exam-setup?lessonId=${lid}&lessonWeek=${wid}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    };
    const enterLesson = (item) => {
      if (forExam.value) {
        goToExamSetupForLesson(item);
        return;
      }
      const lid = resolveLessonRowId(item);
      if (!lid) {
        common_vendor.index.showToast({ title: "课堂数据缺少编号", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/training-plan-select/training-plan-select?lessonId=${lid}&courseId=${courseId.value}&lessonName=第${item.weekIndex}周&courseName=${encodeURIComponent(className.value || "")}`
      });
    };
    const onCardMainClick = (item) => {
      enterLesson(item);
    };
    const formatTime = (timeStr) => {
      if (!timeStr)
        return "--";
      const date = new Date(timeStr);
      if (isNaN(date.getTime()))
        return timeStr;
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${month}/${day} ${hours}:${minutes}`;
    };
    const getStatusClass = (status) => {
      const statusMap = {
        0: "status-pending",
        1: "status-active",
        2: "status-finished"
      };
      return statusMap[status] || "status-pending";
    };
    function decodeClassName(raw) {
      if (!raw)
        return "课堂列表";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    function applyRouteOptions(options) {
      options = options || {};
      courseId.value = parseInt(options.courseId, 10) || 0;
      classId.value = parseInt(options.classId, 10) || 0;
      className.value = decodeClassName(options.className || "");
      forExam.value = options.forExam === "1" || options.forExam === "true";
      common_vendor.index.setNavigationBarTitle({
        title: className.value || "课堂列表"
      });
    }
    common_vendor.onLoad((options) => {
      applyRouteOptions(options);
      getLessonList();
    });
    common_vendor.onShow(() => {
      if (courseId.value) {
        getLessonList();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "课堂列表"
        }),
        b: common_vendor.t(className.value),
        c: common_vendor.t(forExam.value ? "选择课堂进行考试" : "课堂列表"),
        d: common_vendor.t(forExam.value ? "选择课堂" : "课堂列表"),
        e: !forExam.value
      }, !forExam.value ? {
        f: common_vendor.o(goToCreateLesson, "73")
      } : {}, {
        g: lessonList.value.length > 0
      }, lessonList.value.length > 0 ? {
        h: common_vendor.f(lessonList.value, (item, idx, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.weekIndex),
            b: common_vendor.t(item.typeText || "普通课堂"),
            c: common_vendor.t(item.statusText || "未开始"),
            d: common_vendor.n(getStatusClass(item.status)),
            e: common_vendor.t(formatTime(item.startTime)),
            f: common_vendor.t(formatTime(item.endTime)),
            g: common_vendor.t(item.teacherName || "--"),
            h: common_vendor.o(($event) => onCardMainClick(item), resolveLessonRowId(item) || "lesson-" + idx)
          }, !forExam.value ? {
            i: common_vendor.o(($event) => deleteLesson(item), resolveLessonRowId(item) || "lesson-" + idx)
          } : {}, {
            j: common_vendor.o(($event) => enterLesson(item), resolveLessonRowId(item) || "lesson-" + idx),
            k: resolveLessonRowId(item) || "lesson-" + idx
          });
        }),
        i: !forExam.value,
        j: common_vendor.t(forExam.value ? "考试设置" : "进入课堂")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-18fa740d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/lesson-list/lesson-list.js.map
