"use strict";
const common_vendor = require("../../common/vendor.js");
const services_trainingPlanApi = require("../../services/trainingPlanApi.js");
const _sfc_main = {
  __name: "plan-project-edit",
  setup(__props) {
    const itemId = common_vendor.ref(0);
    const planIdFromQuery = common_vendor.ref(0);
    const loading = common_vendor.ref(true);
    const saving = common_vendor.ref(false);
    const deleting = common_vendor.ref(false);
    const form = common_vendor.reactive({
      id: 0,
      planId: 0,
      teacherId: 0,
      itemName: "",
      itemContent: "",
      itemType: 1,
      difficulty: 1,
      duration: 20,
      score: 100,
      sortOrder: 1
    });
    const itemTypeLabels = ["基础训练", "强化训练", "考核项目"];
    const difficultyLabels = ["简单", "中等", "困难"];
    const itemTypeIndex = common_vendor.computed(() => Math.max(0, Math.min(2, (Number(form.itemType) || 1) - 1)));
    const difficultyIndex = common_vendor.computed(() => Math.max(0, Math.min(2, (Number(form.difficulty) || 1) - 1)));
    const effectivePlanId = common_vendor.computed(() => {
      const a = Number(form.planId);
      if (Number.isFinite(a) && a > 0)
        return a;
      const b = Number(planIdFromQuery.value);
      return Number.isFinite(b) && b > 0 ? b : 0;
    });
    function applyDetail(d) {
      if (!d || typeof d !== "object")
        return;
      form.id = Number(d.id) || 0;
      form.planId = d.planId != null ? Number(d.planId) : 0;
      form.teacherId = d.teacherId != null ? Number(d.teacherId) : services_trainingPlanApi.getTeacherIdFromStorage() || 0;
      form.itemName = (d.itemName != null ? String(d.itemName) : "") || "";
      form.itemContent = d.itemContent != null ? String(d.itemContent) : "";
      form.itemType = d.itemType != null ? Number(d.itemType) : 1;
      form.difficulty = d.difficulty != null ? Number(d.difficulty) : 1;
      form.duration = d.duration != null ? Number(d.duration) : 20;
      form.score = d.score != null ? Number(d.score) : 100;
      form.sortOrder = d.sortOrder != null ? Number(d.sortOrder) : 1;
      if (!Number.isFinite(form.itemType) || form.itemType < 1 || form.itemType > 3)
        form.itemType = 1;
      if (!Number.isFinite(form.difficulty) || form.difficulty < 1 || form.difficulty > 3)
        form.difficulty = 1;
    }
    function onItemType(e) {
      const i = Number(e.detail.value);
      if (!Number.isNaN(i))
        form.itemType = i + 1;
    }
    function onDifficulty(e) {
      const i = Number(e.detail.value);
      if (!Number.isNaN(i))
        form.difficulty = i + 1;
    }
    async function onSave() {
      const name = (form.itemName || "").trim();
      if (!name) {
        common_vendor.index.showToast({ title: "请输入项目名称", icon: "none" });
        return;
      }
      if (!form.id) {
        common_vendor.index.showToast({ title: "项目 id 无效", icon: "none" });
        return;
      }
      const tid = services_trainingPlanApi.getTeacherIdFromStorage();
      if (!tid) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      const body = {
        id: form.id,
        teacherId: form.teacherId > 0 ? form.teacherId : tid,
        itemName: name,
        itemContent: (form.itemContent || "").trim(),
        itemType: form.itemType,
        difficulty: form.difficulty,
        duration: parseInt(String(form.duration), 10) || 20,
        score: parseInt(String(form.score), 10) || 100,
        sortOrder: parseInt(String(form.sortOrder), 10) || 1
      };
      Object.keys(body).forEach((k) => {
        if (body[k] === void 0 || body[k] === "")
          delete body[k];
      });
      try {
        saving.value = true;
        common_vendor.index.showLoading({ title: "保存中…" });
        await services_trainingPlanApi.updatePlanProject(body);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 500);
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: e && e.message || "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    }
    function onDelete() {
      if (!form.id || deleting.value)
        return;
      const name = (form.itemName || "").trim() || "该项目";
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除「${name}」吗？删除后无法恢复。`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            deleting.value = true;
            common_vendor.index.showLoading({ title: "删除中…" });
            await services_trainingPlanApi.deletePlanProject(form.id);
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            setTimeout(() => common_vendor.index.navigateBack(), 500);
          } catch (e) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: e && e.message || "删除失败", icon: "none" });
          } finally {
            deleting.value = false;
          }
        }
      });
    }
    function goMaterial() {
      const pid = effectivePlanId.value;
      if (!pid)
        return;
      const q = [
        `planId=${pid}`,
        `itemId=${form.id}`,
        `projectName=${encodeURIComponent(form.itemName || "")}`,
        `planTitle=${encodeURIComponent("训练计划")}`
      ].join("&");
      common_vendor.index.navigateTo({ url: `/pages/material-manage/material-manage?${q}` });
    }
    common_vendor.onLoad(async (opt) => {
      const id = opt && opt.itemId != null ? parseInt(String(opt.itemId), 10) : 0;
      itemId.value = id;
      if (!Number.isFinite(id) || id <= 0) {
        loading.value = false;
        common_vendor.index.showToast({ title: "缺少项目 id", icon: "none" });
        setTimeout(() => common_vendor.index.navigateBack(), 600);
        return;
      }
      const qPlan = opt && opt.planId != null ? parseInt(String(opt.planId), 10) : 0;
      if (Number.isFinite(qPlan) && qPlan > 0) {
        planIdFromQuery.value = qPlan;
        form.planId = qPlan;
      }
      const fallbackName = opt && opt.itemName ? decodeURIComponent(opt.itemName) : "";
      try {
        const d = await services_trainingPlanApi.fetchPlanProjectById(id);
        applyDetail(d);
        if (fallbackName && !form.itemName)
          form.itemName = fallbackName;
        if (qPlan > 0 && (!form.planId || form.planId <= 0))
          form.planId = qPlan;
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "加载失败", icon: "none" });
        if (fallbackName)
          form.itemName = fallbackName;
        form.id = id;
      } finally {
        loading.value = false;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : common_vendor.e({
        b: form.itemName,
        c: common_vendor.o(($event) => form.itemName = $event.detail.value, "78"),
        d: form.itemContent,
        e: common_vendor.o(($event) => form.itemContent = $event.detail.value, "fe"),
        f: common_vendor.t(itemTypeLabels[itemTypeIndex.value]),
        g: itemTypeLabels,
        h: itemTypeIndex.value,
        i: common_vendor.o(onItemType, "46"),
        j: common_vendor.t(difficultyLabels[difficultyIndex.value]),
        k: difficultyLabels,
        l: difficultyIndex.value,
        m: common_vendor.o(onDifficulty, "af"),
        n: form.duration,
        o: common_vendor.o(($event) => form.duration = $event.detail.value, "11"),
        p: form.score,
        q: common_vendor.o(($event) => form.score = $event.detail.value, "99"),
        r: form.sortOrder,
        s: common_vendor.o(($event) => form.sortOrder = $event.detail.value, "75"),
        t: saving.value,
        v: common_vendor.o(onSave, "01"),
        w: form.id && effectivePlanId.value > 0
      }, form.id && effectivePlanId.value > 0 ? {
        x: common_vendor.o(goMaterial, "3c")
      } : {}, {
        y: form.id
      }, form.id ? {
        z: deleting.value,
        A: common_vendor.o(onDelete, "df")
      } : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-04eb9d4b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/plan-project-edit/plan-project-edit.js.map
