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
  __name: "exam-create",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const examId = common_vendor.ref(0);
    const isEdit = common_vendor.computed(() => examId.value > 0);
    const form = common_vendor.reactive({
      title: "",
      scoreRatio: 0,
      lessonId: 0
    });
    const scoreRatioText = common_vendor.ref("");
    const lessonOptions = common_vendor.ref([]);
    const lessonIndex = common_vendor.ref(-1);
    const examList = common_vendor.ref([]);
    const saving = common_vendor.ref(false);
    const skipNextShowReload = common_vendor.ref(true);
    const usage = common_vendor.computed(
      () => services_examApi.calcScoreRatioUsage(examList.value, isEdit.value ? examId.value : 0)
    );
    const usedRatio = common_vendor.computed(() => usage.value.used);
    const remainingRatio = common_vendor.computed(() => usage.value.remaining);
    const lessonLabels = common_vendor.computed(
      () => lessonOptions.value.map((row) => {
        const week = row.weekIndex != null ? `第${row.weekIndex}周` : "课堂";
        const id = services_examApi.resolveLessonId(row);
        return `${week}（ID ${id}）`;
      })
    );
    function decodeName(raw) {
      if (!raw)
        return "";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    async function loadExamList() {
      if (!courseId.value)
        return;
      try {
        const data = await services_examApi.fetchExamListByCourse(courseId.value);
        examList.value = Array.isArray(data) ? data : [];
      } catch {
        examList.value = [];
      }
    }
    async function reloadLessons() {
      if (!courseId.value)
        return;
      try {
        lessonOptions.value = await services_examApi.fetchLessonsByCourse(courseId.value, { type: 2 });
        if (form.lessonId) {
          const idx = lessonOptions.value.findIndex(
            (r) => services_examApi.resolveLessonId(r) === form.lessonId
          );
          lessonIndex.value = idx;
        }
      } catch (e) {
        lessonOptions.value = [];
        common_vendor.index.showToast({ title: e.message || "加载课堂失败", icon: "none" });
      }
    }
    function onLessonChange(e) {
      const idx = Number(e.detail.value);
      lessonIndex.value = idx;
      const row = lessonOptions.value[idx];
      form.lessonId = row ? services_examApi.resolveLessonId(row) : 0;
      if (!form.title && row && row.weekIndex != null) {
        form.title = `第${row.weekIndex}周考试`;
      }
    }
    function goCreateLesson() {
      const name = encodeURIComponent(className.value || "");
      common_vendor.index.navigateTo({
        url: `/pages/lesson-create/lesson-create?courseId=${courseId.value}&classId=${classId.value}&className=${name}&preferType=2`
      });
    }
    async function loadDetail() {
      if (!examId.value)
        return;
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const data = await services_examApi.fetchExamGet(examId.value);
        if (data) {
          form.title = data.title || "";
          form.scoreRatio = Number(data.scoreRatio) || 0;
          scoreRatioText.value = String(form.scoreRatio || "");
          form.lessonId = services_examApi.resolveLessonId(data) || Number(data.lessonId) || 0;
          await reloadLessons();
          const idx = lessonOptions.value.findIndex(
            (r) => services_examApi.resolveLessonId(r) === form.lessonId
          );
          lessonIndex.value = idx;
        }
      } catch (e) {
        common_vendor.index.showToast({ title: e.message || "加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    async function submit() {
      const title = (form.title || "").trim();
      if (!title) {
        common_vendor.index.showToast({ title: "请填写考试标题", icon: "none" });
        return;
      }
      const ratio = parseInt(String(scoreRatioText.value).trim(), 10);
      if (!Number.isFinite(ratio) || ratio < 1 || ratio > 100) {
        common_vendor.index.showToast({ title: "占比须为 1–100 的整数", icon: "none" });
        return;
      }
      if (ratio > remainingRatio.value) {
        common_vendor.index.showToast({
          title: `占比超出：已占用 ${usedRatio.value}%，剩余 ${remainingRatio.value}%`,
          icon: "none",
          duration: 2500
        });
        return;
      }
      if (!form.lessonId) {
        common_vendor.index.showToast({ title: "请选择考试课堂", icon: "none" });
        return;
      }
      saving.value = true;
      common_vendor.index.showLoading({ title: "保存中..." });
      try {
        if (isEdit.value) {
          await services_examApi.updateExam({
            id: examId.value,
            courseId: courseId.value,
            lessonId: form.lessonId,
            title,
            scoreRatio: ratio
          });
          common_vendor.index.showToast({ title: "已保存", icon: "success" });
          setTimeout(() => common_vendor.index.navigateBack(), 500);
        } else {
          const data = await services_examApi.createExam({
            courseId: courseId.value,
            lessonId: form.lessonId,
            title,
            scoreRatio: ratio
          });
          const newId = services_examApi.normalizeCreateLongId(data) || services_examApi.resolveExamId(data);
          common_vendor.index.showToast({ title: "创建成功", icon: "success" });
          const name = encodeURIComponent(className.value || "");
          const et = encodeURIComponent(title);
          setTimeout(() => {
            if (newId) {
              common_vendor.index.redirectTo({
                url: `/pages/exam-items/exam-items?examId=${newId}&examTitle=${et}&courseId=${courseId.value}&classId=${classId.value}&className=${name}`
              });
            } else {
              common_vendor.index.navigateBack();
            }
          }, 400);
        }
      } catch (e) {
        common_vendor.index.showToast({ title: e.message || "保存失败", icon: "none", duration: 2800 });
      } finally {
        common_vendor.index.hideLoading();
        saving.value = false;
      }
    }
    common_vendor.onLoad(async (options) => {
      options = options || {};
      courseId.value = parseInt(options.courseId, 10) || 0;
      classId.value = parseInt(options.classId, 10) || 0;
      className.value = decodeName(options.className);
      examId.value = parseInt(options.examId, 10) || 0;
      const preLessonId = parseInt(options.lessonId, 10) || 0;
      const preWeek = parseInt(options.lessonWeek, 10) || 0;
      await loadExamList();
      await reloadLessons();
      if (isEdit.value) {
        await loadDetail();
      } else if (preLessonId) {
        form.lessonId = preLessonId;
        const idx = lessonOptions.value.findIndex(
          (r) => services_examApi.resolveLessonId(r) === preLessonId
        );
        lessonIndex.value = idx;
        if (!form.title && preWeek) {
          form.title = `第${preWeek}周考试`;
        }
      }
      skipNextShowReload.value = true;
    });
    common_vendor.onShow(async () => {
      if (skipNextShowReload.value) {
        skipNextShowReload.value = false;
        return;
      }
      await loadExamList();
      await reloadLessons();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: isEdit.value ? "编辑考试" : "新建考试"
        }),
        b: common_vendor.t(className.value),
        c: common_vendor.t(isEdit.value ? "修改考试配置" : "关联考试课堂与成绩占比"),
        d: common_vendor.t(usedRatio.value),
        e: common_vendor.t(remainingRatio.value),
        f: form.title,
        g: common_vendor.o(($event) => form.title = $event.detail.value, "cf"),
        h: scoreRatioText.value,
        i: common_vendor.o(($event) => scoreRatioText.value = $event.detail.value, "18"),
        j: lessonOptions.value.length > 0
      }, lessonOptions.value.length > 0 ? {
        k: common_vendor.t(lessonIndex.value >= 0 ? lessonLabels.value[lessonIndex.value] : "请选择考试课堂"),
        l: lessonIndex.value < 0 ? 1 : "",
        m: lessonLabels.value,
        n: lessonIndex.value,
        o: common_vendor.o(onLessonChange, "09")
      } : {}, {
        p: common_vendor.o(goCreateLesson, "8f"),
        q: common_vendor.o(reloadLessons, "c1"),
        r: common_vendor.t(isEdit.value ? "保存修改" : "创建并配置考核项"),
        s: saving.value,
        t: common_vendor.o(submit, "3c")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-05a371d5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-create/exam-create.js.map
