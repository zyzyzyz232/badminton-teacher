"use strict";
const common_vendor = require("../../common/vendor.js");
const services_trainingPlanApi = require("../../services/trainingPlanApi.js");
const _sfc_main = {
  __name: "training-plan-arrange",
  setup(__props) {
    const planId = common_vendor.ref("");
    const isNew = common_vendor.ref(true);
    const lessonIdFromQuery = common_vendor.ref(0);
    const courseIdFromQuery = common_vendor.ref(0);
    const planDetailRaw = common_vendor.ref(null);
    const planForm = common_vendor.reactive({
      planTitle: "",
      planContent: "",
      duration: 60,
      planType: 1,
      difficulty: 1
    });
    const planTypeLabels = ["常规", "专项", "测试"];
    const planDifficultyLabels = ["简单", "中等", "困难"];
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
    async function loadPlanEditSection() {
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
      if (!planId.value)
        return;
      let d = planDetailRaw.value;
      if (!d || d.id == null) {
        try {
          d = await services_trainingPlanApi.fetchTrainingPlanDetail(planId.value);
          planDetailRaw.value = d;
        } catch (_) {
          d = null;
        }
      }
      if (!d || d.id == null) {
        throw new Error("无法获取计划信息");
      }
      const titleTrim = String(planForm.planTitle || "").trim();
      if (!titleTrim) {
        throw new Error("请填写计划标题");
      }
      const tid = services_trainingPlanApi.getTeacherIdFromStorage();
      const durParsed = parseInt(String(planForm.duration), 10);
      const duration = Number.isFinite(durParsed) && durParsed > 0 ? durParsed : d.duration != null ? Number(d.duration) : 60;
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
    const catalogItems = common_vendor.ref([]);
    const planRows = common_vendor.ref([]);
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
    function genKey() {
      return `k_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    function ensureTrailingEmpty() {
      const last = planRows.value[planRows.value.length - 1];
      if (!last || last.project != null) {
        planRows.value.push({ _key: genKey(), project: null });
      }
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
    async function onQuickAddToPlan(p) {
      if (!isCatalogItemAddable(p))
        return;
      await attachCatalogItemToPlan(p);
    }
    function goEditProject(p) {
      if (!isCatalogItemEditable(p))
        return;
      const itemId = encodeURIComponent(String(p.id));
      const pid = encodeURIComponent(String(planId.value || ""));
      const nm = encodeURIComponent(String(p.name || ""));
      common_vendor.index.navigateTo({
        url: `/pages/plan-project-edit/plan-project-edit?itemId=${itemId}&planId=${pid}&itemName=${nm}`,
        fail: () => {
          common_vendor.index.showToast({ title: "打开编辑页失败", icon: "none" });
        }
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
            planRows.value = planRows.value.map(
              (r) => r.project && String(r.project.id) === sid ? { ...r, project: null } : r
            );
            ensureTrailingEmpty();
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          } catch (err) {
            common_vendor.index.showToast({
              title: err && err.message || "删除失败",
              icon: "none"
            });
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
        common_vendor.index.showToast({ title: "请先进入有 planId 的计划页", icon: "none" });
        return;
      }
      const tid = services_trainingPlanApi.getTeacherIdFromStorage();
      if (!tid) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
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
        const onPlan = await services_trainingPlanApi.fetchPlanProjectsByPlan(pid);
        const dup = (Array.isArray(onPlan) ? onPlan : []).some((x) => Number(x.id) === itemId);
        if (dup) {
          common_vendor.index.showToast({ title: "计划中已有该项", icon: "none" });
          return;
        }
        await services_trainingPlanApi.associatePlanProject(itemId, pid);
        common_vendor.index.showToast({ title: "已加入计划", icon: "success" });
        await loadData();
      } catch (err) {
        const msg = err && err.message ? err.message : "操作失败";
        common_vendor.index.showToast({ title: msg, icon: "none", duration: 2500 });
      } finally {
        common_vendor.index.hideLoading();
      }
    }
    function swapRows(i, j) {
      const a = planRows.value[i];
      const b = planRows.value[j];
      if (!a || !b)
        return;
      if (!a.project || !b.project)
        return;
      const tmp = a.project;
      a.project = b.project;
      b.project = tmp;
    }
    function canMovePlanRowUp(index) {
      if (index <= 0)
        return false;
      const cur = planRows.value[index];
      const prev = planRows.value[index - 1];
      return !!((cur == null ? void 0 : cur.project) && (prev == null ? void 0 : prev.project));
    }
    function canMovePlanRowDown(index) {
      if (index >= planRows.value.length - 1)
        return false;
      const cur = planRows.value[index];
      const next = planRows.value[index + 1];
      if (!(cur == null ? void 0 : cur.project))
        return false;
      if (next == null ? void 0 : next.project)
        return true;
      return !!(next && !next.project);
    }
    function movePlanRowUp(index) {
      if (!canMovePlanRowUp(index))
        return;
      swapRows(index, index - 1);
    }
    function movePlanRowDown(index) {
      if (!canMovePlanRowDown(index))
        return;
      const cur = planRows.value[index];
      const next = planRows.value[index + 1];
      if (next == null ? void 0 : next.project) {
        swapRows(index, index + 1);
      } else if (next && (cur == null ? void 0 : cur.project)) {
        next.project = cur.project;
        cur.project = null;
        ensureTrailingEmpty();
      }
    }
    function removeAt(index) {
      const row = planRows.value[index];
      if (!(row == null ? void 0 : row.project))
        return;
      row.project = null;
      const filled = planRows.value.filter((r) => r.project);
      planRows.value = [...filled, { _key: genKey(), project: null }];
    }
    function mapPlanRowProjectFromApi(p) {
      if (!p || typeof p !== "object")
        return null;
      const id = p.id ?? p.itemId;
      return {
        id: id != null ? String(id) : "",
        name: (p.itemName != null ? p.itemName : p.name) || "",
        durationMin: p.duration != null ? Number(p.duration) : p.durationMin != null ? Number(p.durationMin) : void 0
      };
    }
    function planSlotsFromDetail(detail) {
      if (!detail || typeof detail !== "object")
        return [];
      if (Array.isArray(detail.slots)) {
        return detail.slots.map((s) => {
          const raw = s && (s.project || s.item || s.planProject);
          return { project: raw ? mapPlanRowProjectFromApi(raw) : null };
        });
      }
      const keys = [
        "planProjects",
        "planProjectList",
        "planProjectRespVOList",
        "projects",
        "items",
        "children"
      ];
      let list = [];
      for (const k of keys) {
        if (Array.isArray(detail[k])) {
          list = detail[k];
          break;
        }
      }
      if (!list.length)
        return [];
      return [...list].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)).map((p) => ({ project: mapPlanRowProjectFromApi(p) }));
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
    function planRowsFromProjectList(list, currentPlanId) {
      const pid = currentPlanId != null && currentPlanId !== "" ? Number(String(currentPlanId)) : NaN;
      const hasPid = Number.isFinite(pid) && pid > 0;
      const sorted = sortPlanProjectsForDisplay(list);
      const rows = [];
      for (const p of sorted) {
        if (hasPid && p.planId != null && Number(p.planId) !== pid)
          continue;
        const project = mapPlanRowProjectFromApi(p);
        if (project && project.id)
          rows.push({ _key: genKey(), project });
      }
      return rows;
    }
    async function loadData() {
      catalogItems.value = [];
      if (planId.value) {
        await loadPlanEditSection();
      } else {
        planDetailRaw.value = null;
      }
      try {
        const list = await services_trainingPlanApi.fetchTrainingProjectCatalogForArrange(planId.value || void 0);
        if (Array.isArray(list) && list.length)
          catalogItems.value = list;
      } catch (_) {
      }
      seedMockIfEmpty();
      if (planId.value) {
        try {
          const projectList = await services_trainingPlanApi.fetchPlanProjectsByPlan(planId.value);
          const rows = planRowsFromProjectList(projectList, planId.value);
          if (rows.length > 0) {
            planRows.value = rows;
            ensureTrailingEmpty();
            return;
          }
        } catch (_) {
        }
        try {
          const detail = await services_trainingPlanApi.fetchTrainingPlanDetail(planId.value);
          const slots = planSlotsFromDetail(detail);
          if (slots.length && slots.some((s) => s.project)) {
            planRows.value = slots.map((s) => ({
              _key: genKey(),
              project: s.project
            }));
            ensureTrailingEmpty();
            return;
          }
        } catch (_) {
        }
      }
      planRows.value = [{ _key: genKey(), project: null }];
      ensureTrailingEmpty();
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
        if (!itemId) {
          common_vendor.index.__f__("error", "at pages/training-plan-arrange/training-plan-arrange.vue:906", "[submitCreateProject]", createStage, {
            createdId,
            payload,
            hint: "extractPlanProjectItemId 为空"
          });
          throw new Error("创建成功但未返回项目 id");
        }
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
        if (!imageUrl && !videoUrl) {
          common_vendor.index.__f__("error", "at pages/training-plan-arrange/training-plan-arrange.vue:926", "[submitCreateProject]", createStage, {
            uploadData,
            materialType: mt,
            hint: "urlsFromUploadData 未得到 imageUrl/videoUrl"
          });
          throw new Error("上传未返回文件地址，无法登记资料");
        }
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
        const newCatalogItem = {
          id: String(itemId),
          name,
          durationMin: duration,
          hasMaterials: true
        };
        const existIdx = catalogItems.value.findIndex((x) => String(x.id) === newCatalogItem.id);
        if (existIdx >= 0) {
          catalogItems.value[existIdx] = newCatalogItem;
        } else {
          catalogItems.value.unshift(newCatalogItem);
        }
        closeCreateProjectModal();
        await loadData();
        common_vendor.index.showToast({ title: "创建成功", icon: "success" });
      } catch (err) {
        const msg = err && err.message ? err.message : "创建失败";
        common_vendor.index.__f__("error", "at pages/training-plan-arrange/training-plan-arrange.vue:969", "[submitCreateProject] failed", {
          stage: createStage,
          message: msg,
          err,
          payload,
          planId: hasPlanId ? pid : "(omitted)",
          materialType: mt,
          materialTempPath: projectForm.value.materialTempPath
        });
        common_vendor.index.showToast({ title: msg, icon: "none", duration: 2800 });
      } finally {
        clearCreateProjectLoading();
      }
    }
    async function onSave() {
      const slots = planRows.value.filter((r) => r.project).map((r) => ({ project: r.project }));
      try {
        common_vendor.index.showLoading({ title: "保存中…" });
        if (planId.value) {
          await persistPlanInfo();
        }
        await services_trainingPlanApi.saveTrainingPlanArrangement({
          planId: planId.value || void 0,
          slots
        });
        await loadData();
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 600);
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: e && e.message || "保存失败", icon: "none" });
      }
    }
    common_vendor.onLoad(async (opt) => {
      planId.value = opt && opt.planId || "";
      const lid = opt && opt.lessonId != null && opt.lessonId !== "" ? parseInt(String(opt.lessonId), 10) : NaN;
      lessonIdFromQuery.value = Number.isFinite(lid) && lid > 0 ? lid : 0;
      const cid = opt && opt.courseId != null && opt.courseId !== "" ? parseInt(String(opt.courseId), 10) : NaN;
      courseIdFromQuery.value = Number.isFinite(cid) && cid > 0 ? cid : 0;
      const wantNew = opt.mode === "new" || !planId.value;
      isNew.value = wantNew;
      common_vendor.index.setNavigationBarTitle({
        title: wantNew ? "新建 · 训练计划安排" : "训练计划安排"
      });
      if (wantNew) {
        try {
          common_vendor.index.showLoading({ title: "创建计划…" });
          const newId = await services_trainingPlanApi.createTrainingPlanDraft({
            planTitle: "未命名训练计划"
          });
          if (newId == null || !Number.isFinite(Number(newId))) {
            throw new Error("创建计划失败");
          }
          planId.value = String(newId);
          isNew.value = false;
          common_vendor.index.setNavigationBarTitle({ title: "训练计划安排" });
        } catch (err) {
          const msg = err && err.message ? err.message : "创建失败";
          common_vendor.index.showToast({ title: msg, icon: "none", duration: 2800 });
          setTimeout(() => common_vendor.index.navigateBack(), 800);
          return;
        } finally {
          common_vendor.index.hideLoading();
        }
      }
      await loadData();
    });
    let arrangePageShowCount = 0;
    common_vendor.onShow(async () => {
      if (!planId.value)
        return;
      arrangePageShowCount += 1;
      if (arrangePageShowCount === 1)
        return;
      await loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: planId.value
      }, planId.value ? {
        b: planForm.planTitle,
        c: common_vendor.o(($event) => planForm.planTitle = $event.detail.value, "e6"),
        d: planForm.planContent,
        e: common_vendor.o(($event) => planForm.planContent = $event.detail.value, "6a"),
        f: common_vendor.t(planTypeLabels[planTypePickerIndex.value]),
        g: planTypeLabels,
        h: planTypePickerIndex.value,
        i: common_vendor.o(onPlanTypePick, "a9"),
        j: common_vendor.t(planDifficultyLabels[planDifficultyPickerIndex.value]),
        k: planDifficultyLabels,
        l: planDifficultyPickerIndex.value,
        m: common_vendor.o(onPlanDifficultyPick, "d0"),
        n: planForm.duration,
        o: common_vendor.o(($event) => planForm.duration = $event.detail.value, "06"),
        p: common_vendor.o(confirmDeleteTrainingPlan, "45")
      } : {}, {
        q: common_vendor.f(catalogItems.value, (p, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(p.name),
            b: p.durationMin != null
          }, p.durationMin != null ? {
            c: common_vendor.t(p.durationMin)
          } : {}, {
            d: isCatalogItemAddable(p)
          }, isCatalogItemAddable(p) ? {
            e: common_vendor.o(($event) => onQuickAddToPlan(p), p.id)
          } : {}, {
            f: isCatalogItemEditable(p)
          }, isCatalogItemEditable(p) ? {
            g: common_vendor.o(($event) => goEditProject(p), p.id)
          } : {}, {
            h: isCatalogItemEditable(p)
          }, isCatalogItemEditable(p) ? {
            i: common_vendor.o(($event) => confirmDeleteProject(p), p.id)
          } : {}, {
            j: common_vendor.o(() => {
            }, p.id),
            k: common_vendor.o(() => {
            }, p.id),
            l: common_vendor.o(() => {
            }, p.id),
            m: p.id
          });
        }),
        r: common_vendor.o(openCreateProjectModal, "f8"),
        s: common_vendor.f(planRows.value, (row, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: row.project
          }, row.project ? common_vendor.e({
            c: common_vendor.t(row.project.name),
            d: row.project.durationMin != null
          }, row.project.durationMin != null ? {
            e: common_vendor.t(row.project.durationMin)
          } : {}) : {}, {
            f: row.project
          }, row.project ? {
            g: !canMovePlanRowUp(index) ? 1 : "",
            h: common_vendor.o(($event) => movePlanRowUp(index), row._key),
            i: !canMovePlanRowDown(index) ? 1 : "",
            j: common_vendor.o(($event) => movePlanRowDown(index), row._key),
            k: common_vendor.o(($event) => removeAt(index), row._key)
          } : {}, {
            l: row._key,
            m: !row.project ? 1 : ""
          });
        }),
        t: common_vendor.o(onSave, "c5"),
        v: showCreateProject.value
      }, showCreateProject.value ? common_vendor.e({
        w: createProjectLoading.value
      }, createProjectLoading.value ? {
        x: common_vendor.t(createProjectLoadingText.value),
        y: common_vendor.o(() => {
        }, "d5")
      } : {}, {
        z: createProjectLoading.value ? 1 : "",
        A: common_vendor.o(closeCreateProjectModal, "e8"),
        B: projectForm.value.itemName,
        C: common_vendor.o(($event) => projectForm.value.itemName = $event.detail.value, "0f"),
        D: projectForm.value.itemContent,
        E: common_vendor.o(($event) => projectForm.value.itemContent = $event.detail.value, "d8"),
        F: common_vendor.t(itemTypeLabels[projectForm.value.itemType - 1]),
        G: common_vendor.o(() => {
        }, "86"),
        H: itemTypeLabels,
        I: projectForm.value.itemType - 1,
        J: common_vendor.o(onItemTypePick, "16"),
        K: common_vendor.t(difficultyLabels[projectForm.value.difficulty - 1]),
        L: common_vendor.o(() => {
        }, "1a"),
        M: difficultyLabels,
        N: projectForm.value.difficulty - 1,
        O: common_vendor.o(onDifficultyPick, "d5"),
        P: projectForm.value.duration,
        Q: common_vendor.o(($event) => projectForm.value.duration = $event.detail.value, "06"),
        R: projectForm.value.score,
        S: common_vendor.o(($event) => projectForm.value.score = $event.detail.value, "f9"),
        T: projectForm.value.sortOrder,
        U: common_vendor.o(($event) => projectForm.value.sortOrder = $event.detail.value, "6d"),
        V: common_vendor.f(materialTypeLabelsNew, (label, idx, i0) => {
          return {
            a: common_vendor.t(label),
            b: idx,
            c: projectForm.value.materialTypeNew === idx + 1 ? 1 : "",
            d: common_vendor.o(($event) => setMaterialTypeNew(idx + 1), idx)
          };
        }),
        W: common_vendor.t(projectForm.value.materialTempPath ? "已选择，点击重选" : "选择图片或视频"),
        X: common_vendor.o(chooseMaterialFile, "ed"),
        Y: projectForm.value.materialTitle,
        Z: common_vendor.o(($event) => projectForm.value.materialTitle = $event.detail.value, "be"),
        aa: projectForm.value.materialDescription,
        ab: common_vendor.o(($event) => projectForm.value.materialDescription = $event.detail.value, "83"),
        ac: createProjectLoading.value,
        ad: common_vendor.o(closeCreateProjectModal, "a0"),
        ae: createProjectLoading.value,
        af: common_vendor.o(submitCreateProject, "a2"),
        ag: common_vendor.o(() => {
        }, "da"),
        ah: common_vendor.o(closeCreateProjectModal, "81")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-181a1034"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/training-plan-arrange/training-plan-arrange.js.map
