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
  __name: "training-plan-projects",
  setup(__props) {
    const planId = common_vendor.ref("");
    const planTitleFromQuery = common_vendor.ref("");
    const planItems = common_vendor.ref([]);
    const catalogItems = common_vendor.ref([]);
    const showCatalog = common_vendor.ref(false);
    const showCreateProject = common_vendor.ref(false);
    const createProjectLoading = common_vendor.ref(false);
    const createProjectLoadingText = common_vendor.ref("");
    const projectForm = common_vendor.ref({
      itemName: "",
      itemContent: "",
      itemType: 1,
      difficulty: 1,
      duration: 20,
      score: 100,
      sortOrder: 1,
      materialTypeNew: 1,
      materialTempPath: "",
      materialTitle: "",
      materialDescription: ""
    });
    const itemTypeLabels = ["基础训练", "强化训练", "考核项目"];
    const difficultyLabels = ["简单", "中等", "困难"];
    const materialTypeLabelsNew = ["图片", "视频"];
    const planTitleDisplay = common_vendor.computed(() => {
      const t = (planTitleFromQuery.value || "").trim();
      return t || "训练计划";
    });
    const headerSubText = common_vendor.computed(() => {
      const n = planItems.value.length;
      const total = planItems.value.reduce((s, p) => s + (p.durationMin != null ? Number(p.durationMin) : 0), 0);
      if (n <= 0)
        return "0 个项目";
      return `${n} 个项目${total > 0 ? ` · 共 ${total} 分钟` : ""}`;
    });
    function mapPlanRowProjectFromApi(p) {
      if (!p || typeof p !== "object")
        return null;
      const id = p.id ?? p.itemId;
      if (id == null)
        return null;
      return {
        id: String(id),
        name: (p.itemName != null ? p.itemName : p.name) || "",
        durationMin: p.duration != null ? Number(p.duration) : p.durationMin != null ? Number(p.durationMin) : void 0
      };
    }
    function sortPlanProjectsForDisplay(list) {
      if (!Array.isArray(list))
        return [];
      return [...list].sort((a, b) => {
        const sa = Number(a.sortOrder);
        const sb = Number(b.sortOrder);
        const ha = Number.isFinite(sa);
        const hb = Number.isFinite(sb);
        if (ha && hb && sa !== sb)
          return sa - sb;
        if (ha && !hb)
          return -1;
        if (!ha && hb)
          return 1;
        const ida = Number(a.id ?? a.itemId);
        const idb = Number(b.id ?? b.itemId);
        if (Number.isFinite(ida) && Number.isFinite(idb) && ida !== idb)
          return ida - idb;
        return 0;
      });
    }
    function seedMockIfEmpty() {
      if (catalogItems.value.length)
        return;
      if (services_trainingPlanApi.getTeacherIdFromStorage() > 0)
        return;
      catalogItems.value = [
        { id: "demo-a", name: "高远球", durationMin: 15, hasMaterials: true },
        { id: "demo-b", name: "杀球", durationMin: 20, hasMaterials: true },
        { id: "demo-c", name: "步伐", durationMin: 25, hasMaterials: true },
        { id: "demo-d", name: "多球", durationMin: 30, hasMaterials: false }
      ];
    }
    function isCatalogItemEditable(p) {
      if (!p || p.id == null)
        return false;
      const s = String(p.id);
      if (s.startsWith("demo-") || s.startsWith("tmp_") || s.startsWith("new_"))
        return false;
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n > 0;
    }
    function isCatalogItemAddable(p) {
      if (!p || p.id == null)
        return false;
      const s = String(p.id);
      if (s.startsWith("tmp_") || s.startsWith("new_"))
        return false;
      return true;
    }
    function isInPlan(itemId) {
      const sid = String(itemId);
      return planItems.value.some((x) => String(x.id) === sid);
    }
    async function loadData() {
      if (!planId.value)
        return;
      try {
        const list = await services_trainingPlanApi.fetchTrainingProjectCatalogForArrange(planId.value);
        catalogItems.value = Array.isArray(list) ? list : [];
      } catch (_) {
        catalogItems.value = [];
      }
      seedMockIfEmpty();
      try {
        const projectList = await services_trainingPlanApi.fetchPlanProjectsByPlan(planId.value);
        const sorted = sortPlanProjectsForDisplay(projectList);
        planItems.value = sorted.map((p) => mapPlanRowProjectFromApi(p)).filter((x) => x && x.id);
      } catch (_) {
        planItems.value = [];
      }
    }
    function openCatalogSheet() {
      showCatalog.value = true;
    }
    function closeCatalogSheet() {
      showCatalog.value = false;
    }
    async function moveUp(index) {
      if (index <= 0)
        return;
      const arr = planItems.value;
      const tmp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = tmp;
      planItems.value = [...arr];
      await persistArrangement();
    }
    async function moveDown(index) {
      if (index >= planItems.value.length - 1)
        return;
      const arr = planItems.value;
      const tmp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = tmp;
      planItems.value = [...arr];
      await persistArrangement();
    }
    async function removeAt(index) {
      const item = planItems.value[index];
      if (!item)
        return;
      const sid = String(item.id);
      if (sid.startsWith("demo-") || sid.startsWith("tmp_") || sid.startsWith("new_")) {
        planItems.value = planItems.value.filter((_, i) => i !== index);
        return;
      }
      const itemId = parseInt(sid, 10);
      if (!Number.isFinite(itemId) || itemId <= 0)
        return;
      try {
        common_vendor.index.showLoading({ title: "移除中…" });
        await services_trainingPlanApi.disassociatePlanProject(itemId);
        planItems.value = planItems.value.filter((_, i) => i !== index);
        await persistArrangement();
        common_vendor.index.showToast({ title: "已移除", icon: "success" });
      } catch (err) {
        common_vendor.index.showToast({ title: err && err.message || "移除失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    function goEditProject(p) {
      if (!p || p.id == null)
        return;
      if (!isCatalogItemEditable(p) && !planItems.value.some((x) => String(x.id) === String(p.id)))
        return;
      const itemId = encodeURIComponent(String(p.id));
      const pid = encodeURIComponent(String(planId.value || ""));
      const nm = encodeURIComponent(String(p.name || ""));
      const pt = encodeURIComponent(planTitleDisplay.value);
      common_vendor.index.navigateTo({
        url: `/pages/plan-project-edit/plan-project-edit?itemId=${itemId}&planId=${pid}&itemName=${nm}&planTitle=${pt}`,
        fail: () => common_vendor.index.showToast({ title: "打开编辑页失败", icon: "none" })
      });
    }
    function confirmDeleteProject(p) {
      if (!isCatalogItemEditable(p))
        return;
      const itemId = parseInt(String(p.id), 10);
      if (!Number.isFinite(itemId) || itemId <= 0)
        return;
      const name = (p.name || "").trim() || "该项目";
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除「${name}」吗？删除后无法恢复。`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            common_vendor.index.showLoading({ title: "删除中…" });
            await services_trainingPlanApi.deletePlanProject(itemId);
            const sid = String(p.id);
            catalogItems.value = catalogItems.value.filter((x) => String(x.id) !== sid);
            planItems.value = planItems.value.filter((x) => String(x.id) !== sid);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          } catch (err) {
            common_vendor.index.showToast({ title: err && err.message || "删除失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    }
    async function attachCatalogItemToPlan(item) {
      const name = (item && item.name ? String(item.name) : "").trim();
      if (!name) {
        common_vendor.index.showToast({ title: "项目名称为空", icon: "none" });
        return;
      }
      const pid = parseInt(String(planId.value), 10);
      if (!pid) {
        common_vendor.index.showToast({ title: "计划 id 无效", icon: "none" });
        return;
      }
      const tid = services_trainingPlanApi.getTeacherIdFromStorage();
      if (!tid) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      if (isInPlan(item.id)) {
        common_vendor.index.showToast({ title: "计划中已有该项", icon: "none" });
        return;
      }
      try {
        common_vendor.index.showLoading({ title: "处理中…" });
        if (String(item.id).startsWith("demo-")) {
          await services_trainingPlanApi.createPlanProjectMinimal(pid, name);
          common_vendor.index.showToast({ title: "已加入计划", icon: "success" });
          await loadData();
          return;
        }
        const itemId = parseInt(String(item.id), 10);
        if (!Number.isFinite(itemId)) {
          common_vendor.index.showToast({ title: "项目数据无效", icon: "none" });
          return;
        }
        await services_trainingPlanApi.associatePlanProject(itemId, pid);
        planItems.value.push({
          id: String(itemId),
          name,
          durationMin: item.durationMin != null ? Number(item.durationMin) : void 0
        });
        await persistArrangement();
        common_vendor.index.showToast({ title: "已加入计划", icon: "success" });
      } catch (err) {
        common_vendor.index.showToast({ title: err && err.message || "操作失败", icon: "none", duration: 2500 });
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    async function onAddFromCatalog(p) {
      await attachCatalogItemToPlan(p);
    }
    function openCreateProjectModal() {
      projectForm.value = {
        itemName: "",
        itemContent: "",
        itemType: 1,
        difficulty: 1,
        duration: 20,
        score: 100,
        sortOrder: catalogItems.value.filter((x) => !String(x.id).startsWith("demo-")).length + 1,
        materialTypeNew: 1,
        materialTempPath: "",
        materialTitle: "",
        materialDescription: ""
      };
      showCreateProject.value = true;
    }
    function closeCreateProjectModal() {
      if (createProjectLoading.value)
        return;
      showCreateProject.value = false;
    }
    function setCreateProjectLoading(text) {
      createProjectLoadingText.value = text;
      createProjectLoading.value = true;
    }
    function clearCreateProjectLoading() {
      createProjectLoading.value = false;
      createProjectLoadingText.value = "";
    }
    function onItemTypePick(e) {
      const i = Number(e.detail.value);
      if (!Number.isNaN(i))
        projectForm.value.itemType = i + 1;
    }
    function onDifficultyPick(e) {
      const i = Number(e.detail.value);
      if (!Number.isNaN(i))
        projectForm.value.difficulty = i + 1;
    }
    function setMaterialTypeNew(type) {
      if (projectForm.value.materialTypeNew === type)
        return;
      projectForm.value.materialTypeNew = type;
      projectForm.value.materialTempPath = "";
    }
    function chooseMaterialFile() {
      const mt = projectForm.value.materialTypeNew;
      if (mt === 1) {
        common_vendor.index.chooseImage({
          count: 1,
          success: (res) => {
            projectForm.value.materialTempPath = res.tempFilePaths[0];
          }
        });
      } else {
        common_vendor.index.chooseVideo({
          success: (res) => {
            projectForm.value.materialTempPath = res.tempFilePath;
          }
        });
      }
    }
    function urlsFromUploadData(data, materialType) {
      if (!data || typeof data !== "object") {
        return { imageUrl: "", videoUrl: "" };
      }
      const generic = data.url || data.fileUrl || data.accessUrl || data.path;
      if (materialType === 1) {
        const imageUrl2 = String(data.imageUrl || data.imgUrl || generic || "");
        return { imageUrl: imageUrl2, videoUrl: "" };
      }
      const videoUrl = String(data.videoUrl || generic || "");
      const imageUrl = String(data.imageUrl || data.posterUrl || data.coverUrl || "");
      return { imageUrl, videoUrl };
    }
    async function submitCreateProject() {
      const name = (projectForm.value.itemName || "").trim();
      if (!name) {
        common_vendor.index.showToast({ title: "请输入项目名称", icon: "none" });
        return;
      }
      if (!projectForm.value.materialTempPath) {
        common_vendor.index.showToast({ title: "请选择项目资料文件", icon: "none" });
        return;
      }
      const tid = services_trainingPlanApi.getTeacherIdFromStorage();
      if (!tid) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      const pid = parseInt(String(planId.value), 10);
      const hasPlanId = Number.isFinite(pid) && pid > 0;
      const mt = projectForm.value.materialTypeNew;
      const duration = parseInt(String(projectForm.value.duration), 10) || 20;
      const score = parseInt(String(projectForm.value.score), 10) || 100;
      const sortOrder = parseInt(String(projectForm.value.sortOrder), 10) || 1;
      const payload = {
        teacherId: tid,
        itemName: name,
        itemContent: (projectForm.value.itemContent || "").trim(),
        itemType: projectForm.value.itemType,
        difficulty: projectForm.value.difficulty,
        duration,
        score,
        sortOrder
      };
      let createStage = "init";
      try {
        setCreateProjectLoading("正在创建项目…");
        createStage = "createPlanProject";
        const createdId = await services_trainingPlanApi.createPlanProject(payload);
        const itemId = services_trainingPlanApi.extractPlanProjectItemId(createdId);
        if (!itemId)
          throw new Error("创建成功但未返回项目 id");
        setCreateProjectLoading("正在上传资料…");
        createStage = "uploadPlanMaterialFile";
        const uploadData = await services_trainingPlanApi.uploadPlanMaterialFile({
          filePath: projectForm.value.materialTempPath,
          ...hasPlanId ? { planId: pid } : {},
          itemId,
          materialType: mt,
          title: (projectForm.value.materialTitle || "").trim() || name,
          description: (projectForm.value.materialDescription || "").trim()
        });
        const { imageUrl, videoUrl } = urlsFromUploadData(uploadData, mt);
        if (!imageUrl && !videoUrl)
          throw new Error("上传未返回文件地址，无法登记资料");
        setCreateProjectLoading("正在登记资料…");
        createStage = "createPlanMaterial";
        const matBody = {
          ...hasPlanId ? { planId: pid } : {},
          itemId,
          materialType: mt,
          sortOrder: 0,
          title: (projectForm.value.materialTitle || "").trim() || name,
          description: (projectForm.value.materialDescription || "").trim() || void 0
        };
        if (imageUrl)
          matBody.imageUrl = imageUrl;
        if (videoUrl)
          matBody.videoUrl = videoUrl;
        if (uploadData && uploadData.duration != null) {
          matBody.duration = Number(uploadData.duration);
        }
        await services_trainingPlanApi.createPlanMaterial(matBody);
        closeCreateProjectModal();
        await loadData();
        common_vendor.index.showToast({ title: "创建成功", icon: "success" });
      } catch (err) {
        const msg = err && err.message ? err.message : "创建失败";
        common_vendor.index.__f__("error", "at pages/training-plan-projects/training-plan-projects.vue:589", "[submitCreateProject] failed", { stage: createStage, message: msg, err });
        common_vendor.index.showToast({ title: msg, icon: "none", duration: 2800 });
      } finally {
        clearCreateProjectLoading();
      }
    }
    async function persistArrangement() {
      const slots = planItems.value.map((p) => ({ project: p }));
      try {
        await services_trainingPlanApi.saveTrainingPlanArrangement({
          planId: planId.value,
          slots
        });
      } catch (e) {
        common_vendor.index.showToast({ title: e && e.message || "排序保存失败", icon: "none" });
      }
    }
    common_vendor.onLoad((opt) => {
      planId.value = opt && opt.planId || "";
      try {
        planTitleFromQuery.value = opt && opt.planTitle ? decodeURIComponent(opt.planTitle) : "";
      } catch {
        planTitleFromQuery.value = opt && opt.planTitle || "";
      }
      if (!planId.value) {
        common_vendor.index.showToast({ title: "计划 id 无效", icon: "none" });
        setTimeout(() => common_vendor.index.navigateBack(), 800);
        return;
      }
      common_vendor.index.setNavigationBarTitle({ title: "训练项目编排" });
      loadData();
    });
    let projectsPageShowCount = 0;
    common_vendor.onShow(() => {
      if (!planId.value)
        return;
      projectsPageShowCount += 1;
      if (projectsPageShowCount === 1)
        return;
      loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "训练项目编排"
        }),
        b: common_vendor.t(planTitleDisplay.value),
        c: common_vendor.t(headerSubText.value),
        d: planItems.value.length === 0
      }, planItems.value.length === 0 ? {} : {}, {
        e: common_vendor.f(planItems.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.t(item.name),
            c: item.durationMin != null
          }, item.durationMin != null ? {
            d: common_vendor.t(item.durationMin)
          } : {}, {
            e: index <= 0 ? 1 : "",
            f: common_vendor.o(($event) => moveUp(index), item.id),
            g: index >= planItems.value.length - 1 ? 1 : "",
            h: common_vendor.o(($event) => moveDown(index), item.id),
            i: common_vendor.o(($event) => goEditProject(item), item.id),
            j: common_vendor.o(($event) => removeAt(index), item.id),
            k: item.id
          });
        }),
        f: common_vendor.o(openCatalogSheet, "05"),
        g: common_vendor.o(openCreateProjectModal, "b2"),
        h: showCatalog.value
      }, showCatalog.value ? common_vendor.e({
        i: common_vendor.o(closeCatalogSheet, "f3"),
        j: common_vendor.f(catalogItems.value, (p, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(p.name),
            b: p.durationMin != null
          }, p.durationMin != null ? {
            c: common_vendor.t(p.durationMin)
          } : {}, {
            d: isInPlan(p.id)
          }, isInPlan(p.id) ? {} : isCatalogItemAddable(p) ? {
            f: common_vendor.o(($event) => onAddFromCatalog(p), p.id)
          } : {}, {
            e: isCatalogItemAddable(p),
            g: isCatalogItemEditable(p)
          }, isCatalogItemEditable(p) ? {
            h: common_vendor.o(($event) => goEditProject(p), p.id)
          } : {}, {
            i: isCatalogItemEditable(p)
          }, isCatalogItemEditable(p) ? {
            j: common_vendor.o(($event) => confirmDeleteProject(p), p.id)
          } : {}, {
            k: p.id
          });
        }),
        k: catalogItems.value.length === 0
      }, catalogItems.value.length === 0 ? {} : {}, {
        l: common_vendor.o(() => {
        }, "8b"),
        m: common_vendor.o(closeCatalogSheet, "ad")
      }) : {}, {
        n: showCreateProject.value
      }, showCreateProject.value ? common_vendor.e({
        o: createProjectLoading.value
      }, createProjectLoading.value ? {
        p: common_vendor.t(createProjectLoadingText.value),
        q: common_vendor.o(() => {
        }, "ae")
      } : {}, {
        r: createProjectLoading.value ? 1 : "",
        s: common_vendor.o(closeCreateProjectModal, "5d"),
        t: projectForm.value.itemName,
        v: common_vendor.o(($event) => projectForm.value.itemName = $event.detail.value, "ba"),
        w: projectForm.value.itemContent,
        x: common_vendor.o(($event) => projectForm.value.itemContent = $event.detail.value, "f6"),
        y: common_vendor.t(itemTypeLabels[projectForm.value.itemType - 1]),
        z: itemTypeLabels,
        A: projectForm.value.itemType - 1,
        B: common_vendor.o(onItemTypePick, "20"),
        C: common_vendor.t(difficultyLabels[projectForm.value.difficulty - 1]),
        D: difficultyLabels,
        E: projectForm.value.difficulty - 1,
        F: common_vendor.o(onDifficultyPick, "98"),
        G: projectForm.value.duration,
        H: common_vendor.o(($event) => projectForm.value.duration = $event.detail.value, "68"),
        I: projectForm.value.score,
        J: common_vendor.o(($event) => projectForm.value.score = $event.detail.value, "c8"),
        K: projectForm.value.sortOrder,
        L: common_vendor.o(($event) => projectForm.value.sortOrder = $event.detail.value, "24"),
        M: common_vendor.f(materialTypeLabelsNew, (label, idx, i0) => {
          return {
            a: common_vendor.t(label),
            b: idx,
            c: projectForm.value.materialTypeNew === idx + 1 ? 1 : "",
            d: common_vendor.o(($event) => setMaterialTypeNew(idx + 1), idx)
          };
        }),
        N: common_vendor.t(projectForm.value.materialTempPath ? "已选择，点击重选" : "选择图片或视频"),
        O: common_vendor.o(chooseMaterialFile, "c0"),
        P: projectForm.value.materialTitle,
        Q: common_vendor.o(($event) => projectForm.value.materialTitle = $event.detail.value, "62"),
        R: projectForm.value.materialDescription,
        S: common_vendor.o(($event) => projectForm.value.materialDescription = $event.detail.value, "24"),
        T: createProjectLoading.value,
        U: common_vendor.o(closeCreateProjectModal, "9a"),
        V: createProjectLoading.value,
        W: common_vendor.o(submitCreateProject, "53"),
        X: common_vendor.o(() => {
        }, "f4"),
        Y: common_vendor.o(closeCreateProjectModal, "90")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9706726a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/training-plan-projects/training-plan-projects.js.map
