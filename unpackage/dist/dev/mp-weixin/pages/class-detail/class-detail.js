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
  __name: "class-detail",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const studentCount = common_vendor.ref(0);
    const loadStudentCountFromListClasses = () => {
      const cid = courseId.value;
      if (!cid)
        return;
      const token = common_vendor.index.getStorageSync("token");
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/list-classes`,
        method: "GET",
        header: {
          Authorization: `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        data: { courseId: cid },
        success: (res) => {
          var _a;
          if (((_a = res.data) == null ? void 0 : _a.code) !== 0 || !Array.isArray(res.data.data))
            return;
          const targetId = Number(classId.value);
          const row = res.data.data.find((item) => Number(item.classId) === targetId);
          if (row != null) {
            const n = Number(row.studentCount);
            studentCount.value = Number.isFinite(n) ? n : 0;
          }
        }
      });
    };
    const goToLessonList = () => {
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/lesson-list/lesson-list?courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    };
    const goToExamSetup = () => {
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/exam-list/exam-list?courseId=${courseId.value}&classId=${classId.value}&className=${name}`
      });
    };
    function decodeName(raw) {
      if (!raw)
        return "班级详情";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    common_vendor.onLoad((options) => {
      options = options || {};
      courseId.value = parseInt(options.courseId, 10) || 0;
      classId.value = parseInt(options.classId, 10) || 0;
      className.value = decodeName(options.className);
      common_vendor.index.setNavigationBarTitle({
        title: className.value
      });
      loadStudentCountFromListClasses();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          title: "班级详情"
        }),
        b: common_vendor.t(className.value),
        c: common_vendor.o(goToLessonList, "08"),
        d: common_vendor.o(goToExamSetup, "95"),
        e: common_vendor.t(studentCount.value)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ef848c8e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/class-detail/class-detail.js.map
