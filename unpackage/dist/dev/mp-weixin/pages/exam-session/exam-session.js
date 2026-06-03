"use strict";
const common_vendor = require("../../common/vendor.js");
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "exam-session",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const venueId = common_vendor.ref("");
    const venueLineFromQuery = common_vendor.ref("");
    const examType = common_vendor.ref("");
    const lessonId = common_vendor.ref(0);
    const studentList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const optionsParsed = common_vendor.ref(false);
    const selectedClassStudentId = common_vendor.ref(null);
    const selectedUserId = common_vendor.ref(null);
    const examTypeLabel = common_vendor.computed(() => {
      if (examType.value === "landing")
        return "落点检测";
      if (examType.value === "action_recognition")
        return "动作识别";
      return examType.value || "--";
    });
    const venueDisplayText = common_vendor.computed(() => {
      if (venueLineFromQuery.value)
        return venueLineFromQuery.value;
      const n = venueId.value;
      return n ? `${n}号场地` : "--";
    });
    const headerSubtitle = common_vendor.computed(() => {
      const cn = className.value || "班级";
      return `${cn} · ${venueDisplayText.value} · ${examTypeLabel.value}`;
    });
    function decodeParam(raw) {
      if (!raw)
        return "";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    const getToken = () => common_vendor.index.getStorageSync("token") || "";
    const fetchClassStudents = (cid) => {
      if (!cid) {
        loading.value = false;
        studentList.value = [];
        common_vendor.index.showToast({ title: "班级ID无效", icon: "none" });
        return;
      }
      loading.value = true;
      const token = getToken();
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/class-student/list-by-class`,
        method: "GET",
        header: {
          Authorization: `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        data: { classId: cid },
        success: (res) => {
          loading.value = false;
          if (res.data && res.data.code === 0) {
            studentList.value = res.data.data || [];
          } else {
            studentList.value = [];
            common_vendor.index.showToast({ title: res.data && res.data.msg || "获取学员失败", icon: "none" });
          }
        },
        fail: (err) => {
          loading.value = false;
          common_vendor.index.__f__("error", "at pages/exam-session/exam-session.vue:135", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const selectStudent = (s) => {
      selectedClassStudentId.value = s.id;
      selectedUserId.value = s.userId;
    };
    const onStartExam = () => {
      if (!courseId.value) {
        common_vendor.index.showToast({ title: "缺少课程信息，请返回重试", icon: "none" });
        return;
      }
      if (!classId.value) {
        common_vendor.index.showToast({ title: "缺少班级信息，请返回重试", icon: "none" });
        return;
      }
      if (!lessonId.value) {
        common_vendor.index.showToast({ title: "缺少课次信息，请返回重试", icon: "none" });
        return;
      }
      if (!venueId.value) {
        common_vendor.index.showToast({ title: "缺少场地信息，请返回重试", icon: "none" });
        return;
      }
      if (!examType.value) {
        common_vendor.index.showToast({ title: "缺少考核类型，请返回重试", icon: "none" });
        return;
      }
      if (selectedClassStudentId.value === null) {
        common_vendor.index.showToast({ title: "请选择一名学员", icon: "none" });
        return;
      }
      const s = studentList.value.find((x) => x.id === selectedClassStudentId.value);
      const name = (s == null ? void 0 : s.studentName) || "";
      const no = (s == null ? void 0 : s.studentNo) || "";
      const uid = selectedUserId.value != null && selectedUserId.value !== "" ? String(selectedUserId.value) : "";
      const q = [
        `courseId=${courseId.value}`,
        `classId=${classId.value}`,
        `className=${encodeURIComponent(className.value || "")}`,
        `lessonId=${lessonId.value}`,
        `venueId=${encodeURIComponent(venueId.value || "")}`,
        `venueLabel=${encodeURIComponent(venueLineFromQuery.value || "")}`,
        `examType=${encodeURIComponent(examType.value || "")}`,
        `classStudentId=${selectedClassStudentId.value}`,
        `studentName=${encodeURIComponent(name)}`,
        `studentNo=${encodeURIComponent(no || "")}`,
        `userId=${encodeURIComponent(uid)}`
      ].join("&");
      common_vendor.index.navigateTo({
        url: `/pages/exam-active/exam-active?${q}`
      });
    };
    common_vendor.onLoad((options) => {
      options = options || {};
      courseId.value = parseInt(options.courseId, 10) || 0;
      let cid = parseInt(options.classId, 10);
      if (!cid && options.class_id != null && options.class_id !== "") {
        cid = parseInt(options.class_id, 10) || 0;
      }
      classId.value = cid || 0;
      className.value = decodeParam(options.className || "");
      venueId.value = decodeParam(options.venueId || "");
      venueLineFromQuery.value = decodeParam(options.venueLabel || "");
      examType.value = decodeParam(options.examType || "");
      lessonId.value = parseInt(options.lessonId, 10) || 0;
      common_vendor.index.setNavigationBarTitle({
        title: className.value ? `${className.value} · 考试` : "考核进行中"
      });
      selectedClassStudentId.value = null;
      selectedUserId.value = null;
      optionsParsed.value = true;
      if (!classId.value) {
        loading.value = false;
        studentList.value = [];
        return;
      }
      fetchClassStudents(classId.value);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(headerSubtitle.value),
        b: !optionsParsed.value
      }, !optionsParsed.value ? {} : !classId.value ? {} : loading.value ? {} : studentList.value.length > 0 ? {
        f: common_vendor.f(studentList.value, (s, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(s.studentName || "未命名"),
            b: selectedClassStudentId.value === s.id
          }, selectedClassStudentId.value === s.id ? {} : {}, {
            c: s.studentNo
          }, s.studentNo ? {
            d: common_vendor.t(s.studentNo)
          } : {}, {
            e: s.gender
          }, s.gender ? {
            f: common_vendor.t(s.gender)
          } : {}, {
            g: s.id,
            h: selectedClassStudentId.value === s.id ? 1 : "",
            i: common_vendor.o(($event) => selectStudent(s), s.id)
          });
        })
      } : {}, {
        c: !classId.value,
        d: loading.value,
        e: studentList.value.length > 0,
        g: common_vendor.t(selectedClassStudentId.value !== null ? "开始考核" : "请先选择一名学员"),
        h: selectedClassStudentId.value === null ? 1 : "",
        i: common_vendor.o(onStartExam, "29")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-27eab1e4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-session/exam-session.js.map
