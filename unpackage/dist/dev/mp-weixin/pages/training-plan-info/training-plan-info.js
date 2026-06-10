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
  __name: "training-plan-info",
  setup(__props) {
    const planId = common_vendor.ref("");
    const isNewMode = common_vendor.ref(false);
    const navTitle = common_vendor.ref("训练计划");
    const lessonIdFromQuery = common_vendor.ref(0);
    const courseIdFromQuery = common_vendor.ref(0);
    const lessonName = common_vendor.ref("");
    const courseName = common_vendor.ref("");
    const planDetailRaw = common_vendor.ref(null);
    const projectCount = common_vendor.ref(0);
    const projectTotalMin = common_vendor.ref(0);
    const planForm = common_vendor.reactive({
      planTitle: "",
      planContent: "",
      duration: 60,
      planType: 1,
      difficulty: 1
    });
    const planTypeLabels = ["常规", "专项", "测试"];
    const planDifficultyLabels = ["简单", "中等", "困难"];
    const fromLesson = common_vendor.computed(() => lessonIdFromQuery.value > 0);
    const planTypePickerIndex = common_vendor.computed(() => {
      const t = Number(planForm.planType);
      const i = [1, 2, 3].indexOf(t);
      return i >= 0 ? i : 0;
    });
    const planDifficultyPickerIndex = common_vendor.computed(() => {
      const t = Number(planForm.difficulty);
      const i = [1, 2, 3].indexOf(t);
      return i >= 0 ? i : 0;
    });
    const projectsSummaryText = common_vendor.computed(() => {
      if (!planId.value)
        return "请先保存计划基本信息";
      if (projectCount.value <= 0)
        return "暂无训练项目，点击进入编排";
      const dur = projectTotalMin.value > 0 ? ` · 共 ${projectTotalMin.value} 分钟` : "";
      return `${projectCount.value} 个训练项目${dur}`;
    });
    function applyPlanDetailToForm(d) {
      if (!d || typeof d !== "object")
        return;
      planForm.planTitle = d.planTitle != null ? String(d.planTitle) : "";
      planForm.planContent = d.planContent != null ? String(d.planContent) : "";
      const dur = d.duration != null ? Number(d.duration) : NaN;
      planForm.duration = Number.isFinite(dur) && dur > 0 ? dur : 60;
      const pt = d.planType != null ? Number(d.planType) : NaN;
      planForm.planType = Number.isFinite(pt) && pt >= 1 && pt <= 3 ? pt : 1;
      const df = d.difficulty != null ? Number(d.difficulty) : NaN;
      planForm.difficulty = Number.isFinite(df) && df >= 1 && df <= 3 ? df : 1;
    }
    async function loadProjectSummary() {
      if (!planId.value) {
        projectCount.value = 0;
        projectTotalMin.value = 0;
        return;
      }
      try {
        const list = await services_trainingPlanApi.fetchPlanProjectsByPlan(planId.value);
        const arr = Array.isArray(list) ? list : [];
        projectCount.value = arr.length;
        projectTotalMin.value = arr.reduce((sum, p) => {
          const d = p.duration != null ? Number(p.duration) : 0;
          return sum + (Number.isFinite(d) ? d : 0);
        }, 0);
      } catch (_) {
        projectCount.value = 0;
        projectTotalMin.value = 0;
      }
    }
    async function loadPlanDetail() {
      if (!planId.value) {
        planDetailRaw.value = null;
        return;
      }
      try {
        const d = await services_trainingPlanApi.fetchTrainingPlanDetail(planId.value);
        planDetailRaw.value = d;
        applyPlanDetailToForm(d);
      } catch (_) {
        planDetailRaw.value = null;
      }
    }
    async function loadData() {
      await loadPlanDetail();
      await loadProjectSummary();
    }
    function onPlanTypePick(e) {
      const i = Number(e.detail.value);
      if (!Number.isNaN(i))
        planForm.planType = i + 1;
    }
    function onPlanDifficultyPick(e) {
      const i = Number(e.detail.value);
      if (!Number.isNaN(i))
        planForm.difficulty = i + 1;
    }
    function buildProjectsQuery() {
      const parts = [`planId=${encodeURIComponent(planId.value)}`];
      if (lessonIdFromQuery.value > 0)
        parts.push(`lessonId=${encodeURIComponent(lessonIdFromQuery.value)}`);
      if (courseIdFromQuery.value > 0)
        parts.push(`courseId=${encodeURIComponent(courseIdFromQuery.value)}`);
      if (lessonName.value)
        parts.push(`lessonName=${encodeURIComponent(lessonName.value)}`);
      if (courseName.value)
        parts.push(`courseName=${encodeURIComponent(courseName.value)}`);
      const title = (planForm.planTitle || "").trim();
      if (title)
        parts.push(`planTitle=${encodeURIComponent(title)}`);
      return parts.join("&");
    }
    function goToProjects() {
      if (!planId.value) {
        common_vendor.index.showToast({ title: "请先保存计划", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/training-plan-projects/training-plan-projects?${buildProjectsQuery()}`,
        fail: () => common_vendor.index.showToast({ title: "跳转失败", icon: "none" })
      });
    }
    function confirmDeleteTrainingPlan() {
      const pid = parseInt(String(planId.value), 10);
      if (!Number.isFinite(pid) || pid <= 0) {
        common_vendor.index.showToast({ title: "计划 id 无效", icon: "none" });
        return;
      }
      const title = (planForm.planTitle || "").trim() || "该训练计划";
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
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            setTimeout(() => common_vendor.index.navigateBack(), 500);
          } catch (e) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: e && e.message || "删除失败", icon: "none" });
          }
        }
      });
    }
    async function persistPlanInfo() {
      const titleTrim = String(planForm.planTitle || "").trim();
      if (!titleTrim)
        throw new Error("请填写计划标题");
      const tid = services_trainingPlanApi.getTeacherIdFromStorage();
      if (!tid)
        throw new Error("请先登录");
      const durParsed = parseInt(String(planForm.duration), 10);
      const duration = Number.isFinite(durParsed) && durParsed > 0 ? durParsed : 60;
      if (!planId.value) {
        const createBody = {
          planTitle: titleTrim,
          planContent: String(planForm.planContent || "").trim(),
          planType: Number(planForm.planType) || 1,
          difficulty: Number(planForm.difficulty) || 1,
          duration,
          status: 0,
          teacherId: tid,
          teacherName: services_trainingPlanApi.getTeacherNameFromStorage()
        };
        if (lessonIdFromQuery.value > 0)
          createBody.lessonId = lessonIdFromQuery.value;
        if (courseIdFromQuery.value > 0)
          createBody.courseId = courseIdFromQuery.value;
        const newId = await services_trainingPlanApi.createTeachingPlan(createBody);
        if (newId == null || !Number.isFinite(Number(newId))) {
          throw new Error("创建计划失败");
        }
        planId.value = String(newId);
        isNewMode.value = false;
        navTitle.value = "训练计划";
        common_vendor.index.setNavigationBarTitle({ title: "训练计划" });
        const d2 = await services_trainingPlanApi.fetchTrainingPlanDetail(planId.value);
        planDetailRaw.value = d2;
        applyPlanDetailToForm(d2);
        return;
      }
      let d = planDetailRaw.value;
      if (!d || d.id == null) {
        d = await services_trainingPlanApi.fetchTrainingPlanDetail(planId.value);
        planDetailRaw.value = d;
      }
      if (!d || d.id == null)
        throw new Error("无法获取计划信息");
      const lidQ = lessonIdFromQuery.value;
      const cidQ = courseIdFromQuery.value;
      const lidDetail = d.lessonId != null ? Number(d.lessonId) : NaN;
      const cidDetail = d.courseId != null ? Number(d.courseId) : NaN;
      const lessonId = Number.isFinite(lidQ) && lidQ > 0 ? lidQ : Number.isFinite(lidDetail) && lidDetail > 0 ? lidDetail : void 0;
      const courseId = Number.isFinite(cidQ) && cidQ > 0 ? cidQ : Number.isFinite(cidDetail) && cidDetail > 0 ? cidDetail : void 0;
      const body = {
        id: Number(d.id),
        planTitle: titleTrim,
        planContent: String(planForm.planContent || "").trim(),
        startTime: d.startTime,
        endTime: d.endTime,
        duration,
        planType: Number(planForm.planType) || 1,
        difficulty: Number(planForm.difficulty) || 1,
        status: d.status != null ? Number(d.status) : 0,
        teacherId: d.teacherId != null ? Number(d.teacherId) : tid,
        teacherName: d.teacherName || services_trainingPlanApi.getTeacherNameFromStorage()
      };
      if (lessonId != null)
        body.lessonId = lessonId;
      if (courseId != null)
        body.courseId = courseId;
      Object.keys(body).forEach((k) => {
        if (body[k] === void 0 || body[k] === "")
          delete body[k];
      });
      await services_trainingPlanApi.updateTeachingPlan(body);
    }
    async function onSave() {
      try {
        common_vendor.index.showLoading({ title: "保存中…" });
        await persistPlanInfo();
        await loadProjectSummary();
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: e && e.message || "保存失败", icon: "none" });
      }
    }
    async function onSaveAndBack() {
      try {
        common_vendor.index.showLoading({ title: "保存中…" });
        await persistPlanInfo();
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 500);
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: e && e.message || "保存失败", icon: "none" });
      }
    }
    common_vendor.onLoad((opt) => {
      planId.value = opt && opt.planId || "";
      const lid = opt && opt.lessonId != null && opt.lessonId !== "" ? parseInt(String(opt.lessonId), 10) : NaN;
      lessonIdFromQuery.value = Number.isFinite(lid) && lid > 0 ? lid : 0;
      const cid = opt && opt.courseId != null && opt.courseId !== "" ? parseInt(String(opt.courseId), 10) : NaN;
      courseIdFromQuery.value = Number.isFinite(cid) && cid > 0 ? cid : 0;
      try {
        lessonName.value = opt && opt.lessonName ? decodeURIComponent(opt.lessonName) : "";
      } catch {
        lessonName.value = opt && opt.lessonName || "";
      }
      try {
        courseName.value = opt && opt.courseName ? decodeURIComponent(opt.courseName) : "";
      } catch {
        courseName.value = opt && opt.courseName || "";
      }
      isNewMode.value = opt && opt.mode === "new" && !planId.value;
      navTitle.value = isNewMode.value ? "新建训练计划" : "训练计划";
      common_vendor.index.setNavigationBarTitle({ title: navTitle.value });
      if (planId.value)
        loadData();
    });
    let infoPageShowCount = 0;
    common_vendor.onShow(() => {
      infoPageShowCount += 1;
      if (infoPageShowCount === 1 || !planId.value)
        return;
      loadProjectSummary();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: navTitle.value
        }),
        b: fromLesson.value
      }, fromLesson.value ? {
        c: common_vendor.t(courseName.value),
        d: common_vendor.t(lessonName.value)
      } : {}, {
        e: common_vendor.t(isNewMode.value ? "新建训练计划" : "编辑训练计划"),
        f: planForm.planTitle,
        g: common_vendor.o(($event) => planForm.planTitle = $event.detail.value, "c6"),
        h: planForm.planContent,
        i: common_vendor.o(($event) => planForm.planContent = $event.detail.value, "14"),
        j: common_vendor.t(planTypeLabels[planTypePickerIndex.value]),
        k: planTypeLabels,
        l: planTypePickerIndex.value,
        m: common_vendor.o(onPlanTypePick, "fa"),
        n: common_vendor.t(planDifficultyLabels[planDifficultyPickerIndex.value]),
        o: planDifficultyLabels,
        p: planDifficultyPickerIndex.value,
        q: common_vendor.o(onPlanDifficultyPick, "50"),
        r: planForm.duration,
        s: common_vendor.o(($event) => planForm.duration = $event.detail.value, "b7"),
        t: common_vendor.t(projectsSummaryText.value),
        v: !planId.value ? 1 : "",
        w: common_vendor.o(goToProjects, "79"),
        x: planId.value
      }, planId.value ? {
        y: common_vendor.o(confirmDeleteTrainingPlan, "90")
      } : {}, {
        z: fromLesson.value
      }, fromLesson.value ? {
        A: common_vendor.o(onSaveAndBack, "c8")
      } : {}, {
        B: common_vendor.o(onSave, "ed")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9c0f74af"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/training-plan-info/training-plan-info.js.map
