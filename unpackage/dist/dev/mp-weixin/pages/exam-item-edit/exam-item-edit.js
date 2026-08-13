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
  __name: "exam-item-edit",
  setup(__props) {
    const examId = common_vendor.ref(0);
    const examItemId = common_vendor.ref(0);
    const examTitle = common_vendor.ref("");
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const isEdit = common_vendor.computed(() => examItemId.value > 0);
    const form = common_vendor.reactive({
      itemName: "",
      maxScore: 100,
      weight: 0,
      algoType: 1,
      sortOrder: 0
    });
    const maxScoreText = common_vendor.ref("100");
    const weightText = common_vendor.ref("");
    const sortText = common_vendor.ref("0");
    const algoOptions = ["动作识别", "落点检测"];
    const materialTypeOptions = ["图片", "视频"];
    const uploadType = common_vendor.ref(1);
    const materialList = common_vendor.ref([]);
    const siblingItems = common_vendor.ref([]);
    const saving = common_vendor.ref(false);
    const othersWeight = common_vendor.computed(
      () => services_examApi.calcItemWeightSum(siblingItems.value, isEdit.value ? examItemId.value : 0)
    );
    function hideLoadingThenToast(title, icon = "none", duration = 2e3) {
      common_vendor.index.hideLoading();
      setTimeout(() => {
        common_vendor.index.showToast({ title, icon, duration });
      }, 80);
    }
    function decodeName(raw, fallback = "") {
      if (!raw)
        return fallback;
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    async function loadSiblings() {
      if (!examId.value)
        return;
      try {
        const data = await services_examApi.fetchExamItemListByExam(examId.value);
        siblingItems.value = Array.isArray(data) ? data : [];
      } catch {
        siblingItems.value = [];
      }
    }
    async function loadDetail() {
      if (!examItemId.value)
        return;
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        let data = null;
        try {
          data = await services_examApi.fetchExamItemGet(examItemId.value);
        } catch {
          data = siblingItems.value.find((r) => services_examApi.resolveExamItemId(r) === examItemId.value) || null;
        }
        if (data) {
          form.itemName = data.itemName || data.name || "";
          form.maxScore = Number(data.maxScore) || 100;
          form.weight = Number(data.weight) || 0;
          form.algoType = Number(data.algoType) || 1;
          form.sortOrder = Number(data.sortOrder ?? data.sort ?? 0) || 0;
          maxScoreText.value = String(form.maxScore);
          weightText.value = String(form.weight);
          sortText.value = String(form.sortOrder);
        }
        await loadMaterials();
      } catch (e) {
        hideLoadingThenToast(e.message || "加载失败");
        return;
      }
      common_vendor.index.hideLoading();
    }
    async function loadMaterials() {
      if (!examItemId.value) {
        materialList.value = [];
        return;
      }
      try {
        const data = await services_examApi.fetchExamItemMaterialList(examItemId.value);
        materialList.value = Array.isArray(data) ? data : [];
      } catch {
        materialList.value = [];
      }
    }
    async function saveItem() {
      const itemName = (form.itemName || "").trim();
      if (!itemName) {
        common_vendor.index.showToast({ title: "请填写名称", icon: "none" });
        return;
      }
      const maxScore = parseInt(String(maxScoreText.value).trim(), 10);
      if (!Number.isFinite(maxScore) || maxScore < 1) {
        common_vendor.index.showToast({ title: "满分须为正整数", icon: "none" });
        return;
      }
      const weight = parseInt(String(weightText.value).trim(), 10);
      if (!Number.isFinite(weight) || weight < 1 || weight > 100) {
        common_vendor.index.showToast({ title: "权重须为 1–100 的整数", icon: "none" });
        return;
      }
      const total = othersWeight.value + weight;
      if (total > 100) {
        common_vendor.index.showToast({
          title: `权重合计将为 ${total}%（已超 100%）`,
          icon: "none",
          duration: 2500
        });
        return;
      }
      if (siblingItems.value.length > 0 || isEdit.value) {
        if (total !== 100) {
          const remain = 100 - total;
          if (remain !== 0) {
            common_vendor.index.showModal({
              title: "权重提示",
              content: remain > 0 ? `保存后合计 ${total}%，还需分配 ${remain}%。是否继续保存？` : `保存后合计 ${total}%。是否继续保存？`,
              success: (res) => {
                if (res.confirm)
                  doSave(itemName, maxScore, weight);
              }
            });
            return;
          }
        }
      }
      await doSave(itemName, maxScore, weight);
    }
    async function doSave(itemName, maxScore, weight) {
      const sortOrder = parseInt(String(sortText.value).trim(), 10);
      const sort = Number.isFinite(sortOrder) ? sortOrder : 0;
      saving.value = true;
      common_vendor.index.showLoading({ title: "保存中..." });
      try {
        const body = {
          examId: examId.value,
          itemName,
          maxScore,
          weight,
          algoType: form.algoType,
          sortOrder: sort
        };
        if (isEdit.value) {
          await services_examApi.updateExamItem({ id: examItemId.value, ...body });
          await loadSiblings();
          hideLoadingThenToast("已保存", "success");
        } else {
          const data = await services_examApi.createExamItem(body);
          const newId = services_examApi.normalizeCreateLongId(data) || services_examApi.resolveExamItemId(data);
          if (newId) {
            examItemId.value = newId;
            await loadSiblings();
            await loadMaterials();
            hideLoadingThenToast("已创建", "success");
          } else {
            hideLoadingThenToast("已创建", "success");
            setTimeout(() => common_vendor.index.navigateBack(), 600);
          }
        }
      } catch (e) {
        hideLoadingThenToast(e.message || "保存失败");
      } finally {
        saving.value = false;
      }
    }
    function chooseAndUpload() {
      if (!examItemId.value) {
        common_vendor.index.showToast({ title: "请先保存考核项", icon: "none" });
        return;
      }
      if (uploadType.value === 1) {
        common_vendor.index.chooseImage({
          count: 1,
          success: (res) => {
            doUpload(res.tempFilePaths[0]);
          }
        });
      } else {
        common_vendor.index.chooseVideo({
          success: (res) => {
            doUpload(res.tempFilePath);
          }
        });
      }
    }
    async function doUpload(filePath) {
      if (!filePath)
        return;
      common_vendor.index.showLoading({ title: "上传中...", mask: true });
      let errMsg = "";
      try {
        await services_examApi.uploadAndCreateExamItemMaterial({
          filePath,
          examItemId: examItemId.value,
          materialType: uploadType.value,
          title: "",
          description: ""
        });
      } catch (e) {
        errMsg = e.message || "上传失败";
      } finally {
        common_vendor.index.hideLoading();
      }
      if (errMsg) {
        setTimeout(() => {
          common_vendor.index.showToast({ title: errMsg, icon: "none", duration: 2800 });
        }, 80);
        return;
      }
      await loadMaterials();
      setTimeout(() => {
        common_vendor.index.showToast({ title: "上传成功", icon: "success" });
      }, 80);
    }
    function confirmDeleteMaterial(m, index) {
      const id = m.id;
      if (!id) {
        materialList.value.splice(index, 1);
        return;
      }
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定删除该资料吗？",
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (!res.confirm)
            return;
          common_vendor.index.showLoading({ title: "删除中..." });
          try {
            await services_examApi.deleteExamItemMaterial(id);
            await loadMaterials();
            hideLoadingThenToast("已删除", "success");
          } catch (e) {
            hideLoadingThenToast(e.message || "删除失败");
          }
        }
      });
    }
    function previewImage(url) {
      if (!url)
        return;
      common_vendor.index.previewImage({ urls: [url] });
    }
    common_vendor.onLoad(async (options) => {
      options = options || {};
      examId.value = parseInt(options.examId, 10) || 0;
      examItemId.value = parseInt(options.examItemId, 10) || 0;
      examTitle.value = decodeName(options.examTitle, "考核项");
      courseId.value = parseInt(options.courseId, 10) || 0;
      classId.value = parseInt(options.classId, 10) || 0;
      className.value = decodeName(options.className);
      await loadSiblings();
      if (isEdit.value) {
        await loadDetail();
      } else if (siblingItems.value.length === 0) {
        weightText.value = "100";
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: isEdit.value ? "编辑考核项" : "添加考核项"
        }),
        b: common_vendor.t(examTitle.value),
        c: common_vendor.t(othersWeight.value),
        d: form.itemName,
        e: common_vendor.o(($event) => form.itemName = $event.detail.value, "59"),
        f: maxScoreText.value,
        g: common_vendor.o(($event) => maxScoreText.value = $event.detail.value, "49"),
        h: weightText.value,
        i: common_vendor.o(($event) => weightText.value = $event.detail.value, "de"),
        j: common_vendor.f(algoOptions, (label, idx, i0) => {
          return {
            a: common_vendor.t(label),
            b: idx,
            c: form.algoType === idx + 1 ? 1 : "",
            d: common_vendor.o(($event) => form.algoType = idx + 1, idx)
          };
        }),
        k: sortText.value,
        l: common_vendor.o(($event) => sortText.value = $event.detail.value, "45"),
        m: common_vendor.t(isEdit.value ? "保存考核项" : "创建考核项"),
        n: saving.value,
        o: common_vendor.o(saveItem, "c4"),
        p: isEdit.value
      }, isEdit.value ? common_vendor.e({
        q: common_vendor.f(materialTypeOptions, (label, idx, i0) => {
          return {
            a: common_vendor.t(label),
            b: idx,
            c: uploadType.value === idx + 1 ? 1 : "",
            d: common_vendor.o(($event) => uploadType.value = idx + 1, idx)
          };
        }),
        r: common_vendor.t(uploadType.value === 1 ? "图片" : "视频"),
        s: common_vendor.o(chooseAndUpload, "58"),
        t: materialList.value.length > 0
      }, materialList.value.length > 0 ? {
        v: common_vendor.f(materialList.value, (m, index, i0) => {
          return common_vendor.e({
            a: m.materialType === 1
          }, m.materialType === 1 ? {
            b: m.imageUrl,
            c: common_vendor.o(($event) => previewImage(m.imageUrl), m.id || "m-" + index)
          } : common_vendor.e({
            d: m.videoUrl
          }, m.videoUrl ? {
            e: m.videoUrl
          } : {}), {
            f: common_vendor.t(m.title || "未命名资料"),
            g: m.description
          }, m.description ? {
            h: common_vendor.t(m.description)
          } : {}, {
            i: common_vendor.o(($event) => confirmDeleteMaterial(m, index), m.id || "m-" + index),
            j: m.id || "m-" + index
          });
        })
      } : {}) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2765cfd7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-item-edit/exam-item-edit.js.map
