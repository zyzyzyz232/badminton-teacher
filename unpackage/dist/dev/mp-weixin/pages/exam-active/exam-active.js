"use strict";
const common_vendor = require("../../common/vendor.js");
const services_examRecognition = require("../../services/examRecognition.js");
if (!Array) {
  const _easycom_page_nav_bar2 = common_vendor.resolveComponent("page-nav-bar");
  _easycom_page_nav_bar2();
}
const _easycom_page_nav_bar = () => "../../components/page-nav-bar/page-nav-bar.js";
if (!Math) {
  _easycom_page_nav_bar();
}
const _sfc_main = {
  __name: "exam-active",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const venueId = common_vendor.ref("");
    const venueLineFromQuery = common_vendor.ref("");
    const examType = common_vendor.ref("");
    const classStudentId = common_vendor.ref(0);
    const studentName = common_vendor.ref("");
    const studentNo = common_vendor.ref("");
    const userId = common_vendor.ref("");
    const lessonId = common_vendor.ref(0);
    const isRecognizing = common_vendor.ref(false);
    const sessionId = common_vendor.ref(null);
    const hasShownDevTip = common_vendor.ref(false);
    const lastRequestId = common_vendor.ref("");
    const lastTaskStatus = common_vendor.ref("");
    const isActionRecognition = common_vendor.computed(() => examType.value === "action_recognition");
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
    function decodeParam(raw) {
      if (!raw)
        return "";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    const onStartRecognize = async () => {
      if (isRecognizing.value)
        return;
      if (isActionRecognition.value) {
        await onUploadAndRecognizeTest();
        return;
      }
      if (!venueId.value) {
        common_vendor.index.showToast({ title: "缺少场地信息", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "启动中…", mask: true });
      try {
        const result = await services_examRecognition.startRecognition({
          venueId: venueId.value,
          examType: examType.value,
          courseId: courseId.value,
          classId: classId.value,
          lessonId: lessonId.value,
          classStudentId: classStudentId.value,
          userId: userId.value
        });
        sessionId.value = result.localSessionId;
        isRecognizing.value = true;
        if (!hasShownDevTip.value) {
          hasShownDevTip.value = true;
          common_vendor.index.showToast({ title: "识别服务开发中", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/exam-active/exam-active.vue:133", e);
        common_vendor.index.showToast({ title: "启动失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const onUploadAndRecognizeTest = async () => {
      if (isRecognizing.value)
        return;
      if (!isActionRecognition.value) {
        common_vendor.index.showToast({ title: "当前不是动作识别项目", icon: "none" });
        return;
      }
      let selectedFilePath = "";
      try {
        const chooseRes = await common_vendor.index.chooseVideo({
          sourceType: ["album"],
          compressed: true,
          maxDuration: 300
        });
        selectedFilePath = (chooseRes == null ? void 0 : chooseRes.tempFilePath) || "";
      } catch (e) {
        if (e && (e.errMsg || "").includes("cancel"))
          return;
        common_vendor.index.showToast({ title: "选择视频失败", icon: "none" });
        return;
      }
      if (!selectedFilePath) {
        common_vendor.index.showToast({ title: "未获取到视频文件", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "上传识别中…", mask: true });
      isRecognizing.value = true;
      try {
        const result = await services_examRecognition.startRecognition({
          venueId: venueId.value,
          examType: examType.value,
          courseId: courseId.value,
          classId: classId.value,
          lessonId: lessonId.value,
          classStudentId: classStudentId.value,
          userId: userId.value,
          filePath: selectedFilePath
        });
        sessionId.value = result.localSessionId;
        lastRequestId.value = result.requestId || "";
        lastTaskStatus.value = result.status || "";
        common_vendor.index.showToast({ title: "已提交分析任务", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/exam-active/exam-active.vue:181", e);
        const msg = (e == null ? void 0 : e.message) || "上传识别失败";
        common_vendor.index.showToast({ title: msg, icon: "none" });
      } finally {
        isRecognizing.value = false;
        common_vendor.index.hideLoading();
      }
    };
    const onStopRecognize = async () => {
      common_vendor.index.showLoading({ title: "结束中…", mask: true });
      try {
        await services_examRecognition.stopRecognition(sessionId.value);
        sessionId.value = null;
        isRecognizing.value = false;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/exam-active/exam-active.vue:197", e);
        common_vendor.index.showToast({ title: "结束失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    common_vendor.onLoad((options) => {
      options = options || {};
      courseId.value = parseInt(options.courseId, 10) || 0;
      classId.value = parseInt(options.classId, 10) || 0;
      className.value = decodeParam(options.className || "");
      venueId.value = decodeParam(options.venueId || "");
      venueLineFromQuery.value = decodeParam(options.venueLabel || "");
      examType.value = decodeParam(options.examType || "");
      classStudentId.value = parseInt(options.classStudentId, 10) || 0;
      studentName.value = decodeParam(options.studentName || "");
      studentNo.value = decodeParam(options.studentNo || "");
      userId.value = options.userId != null && options.userId !== "" ? String(options.userId) : "";
      lessonId.value = parseInt(options.lessonId, 10) || 0;
      common_vendor.index.setNavigationBarTitle({
        title: className.value ? `${className.value} · 考核` : "考核识别"
      });
      const requiredReady = !!classId.value && !!courseId.value && !!lessonId.value && !!venueId.value && !!examType.value && !!classStudentId.value;
      if (!requiredReady) {
        common_vendor.index.showToast({ title: "参数不完整，请返回重试", icon: "none" });
        return;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "考核识别"
        }),
        b: common_vendor.t(className.value || "--"),
        c: common_vendor.t(venueDisplayText.value),
        d: common_vendor.t(studentName.value || "--"),
        e: studentNo.value
      }, studentNo.value ? {
        f: common_vendor.t(studentNo.value)
      } : {}, {
        g: common_vendor.t(examTypeLabel.value),
        h: lastRequestId.value
      }, lastRequestId.value ? {
        i: common_vendor.t(lastRequestId.value)
      } : {}, {
        j: lastTaskStatus.value
      }, lastTaskStatus.value ? {
        k: common_vendor.t(lastTaskStatus.value)
      } : {}, {
        l: isActionRecognition.value
      }, isActionRecognition.value ? {
        m: common_vendor.t(isRecognizing.value ? "上传中…" : "测试上传识别"),
        n: isRecognizing.value ? 1 : "",
        o: common_vendor.o(onUploadAndRecognizeTest, "d3")
      } : {}, {
        p: common_vendor.t(isRecognizing.value ? "识别中…" : "开始识别"),
        q: isRecognizing.value ? 1 : "",
        r: common_vendor.o(onStartRecognize, "35"),
        s: common_vendor.o(onStopRecognize, "7d")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a56a423a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-active/exam-active.js.map
