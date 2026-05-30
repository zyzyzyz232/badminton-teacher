"use strict";
const common_vendor = require("../../common/vendor.js");
const API_BASE = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "material-manage",
  setup(__props) {
    const planId = common_vendor.ref(0);
    const itemId = common_vendor.ref(0);
    const projectName = common_vendor.ref("");
    const planTitle = common_vendor.ref("");
    const materialList = common_vendor.ref([]);
    const showUploadModal = common_vendor.ref(false);
    const tempFilePath = common_vendor.ref("");
    const uploadForm = common_vendor.ref({
      materialType: 1,
      title: "",
      description: ""
    });
    const materialTypeOptions = ["图片", "视频"];
    const getToken = () => {
      return common_vendor.index.getStorageSync("token") || "";
    };
    const fetchMaterialList = async () => {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await common_vendor.index.request({
          url: `${API_BASE}/teaching/plan-material/list-by-item`,
          method: "GET",
          header: {
            "Authorization": `Bearer ${getToken()}`
          },
          data: {
            planId: planId.value,
            itemId: itemId.value
          }
        });
        common_vendor.index.hideLoading();
        if (res.data.code === 0) {
          materialList.value = res.data.data || [];
        } else {
          common_vendor.index.showToast({ title: res.data.msg || "获取失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("log", "at pages/material-manage/material-manage.vue:182", "获取资料列表失败", e);
        common_vendor.index.showToast({ title: "网络错误", icon: "none" });
      }
    };
    const chooseFile = () => {
      const isImage = uploadForm.value.materialType === 1;
      if (isImage) {
        common_vendor.index.chooseImage({
          count: 1,
          success: (res) => {
            tempFilePath.value = res.tempFilePaths[0];
            showUploadModal.value = true;
          }
        });
      } else {
        common_vendor.index.chooseVideo({
          success: (res) => {
            tempFilePath.value = res.tempFilePath;
            showUploadModal.value = true;
          }
        });
      }
    };
    const closeUploadModal = () => {
      showUploadModal.value = false;
      tempFilePath.value = "";
      uploadForm.value = {
        materialType: 1,
        title: "",
        description: ""
      };
    };
    const onMaterialTypeChange = (e) => {
      uploadForm.value.materialType = e.detail.value + 1;
    };
    const uploadMaterial = async () => {
      if (!tempFilePath.value) {
        common_vendor.index.showToast({ title: "请选择文件", icon: "none" });
        return;
      }
      try {
        common_vendor.index.showLoading({ title: "上传中..." });
        const uploadRes = await common_vendor.index.uploadFile({
          url: `${API_BASE}/teaching/plan-material/upload`,
          filePath: tempFilePath.value,
          name: "file",
          header: {
            "Authorization": `Bearer ${getToken()}`
          },
          formData: {
            planId: planId.value,
            itemId: itemId.value,
            materialType: uploadForm.value.materialType,
            title: uploadForm.value.title || "",
            description: uploadForm.value.description || ""
          }
        });
        common_vendor.index.hideLoading();
        const data = JSON.parse(uploadRes.data);
        if (data.code === 0) {
          common_vendor.index.showToast({ title: "上传成功", icon: "success" });
          closeUploadModal();
          fetchMaterialList();
        } else {
          common_vendor.index.showToast({ title: data.msg || "上传失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("log", "at pages/material-manage/material-manage.vue:263", "上传失败", e);
        common_vendor.index.showToast({ title: "上传失败", icon: "none" });
      }
    };
    const deleteMaterial = (item, index) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个资料吗？",
        confirmColor: "#ff4d4f",
        success: (res) => {
          if (res.confirm) {
            doDeleteMaterial(item.id, index);
          }
        }
      });
    };
    const doDeleteMaterial = async (materialId, index) => {
      try {
        common_vendor.index.showLoading({ title: "删除中..." });
        materialList.value.splice(index, 1);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "删除成功", icon: "success" });
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "删除失败", icon: "none" });
      }
    };
    const previewImage = (url) => {
      common_vendor.index.previewImage({
        urls: [url]
      });
    };
    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    const formatTime = (timeStr) => {
      if (!timeStr)
        return "";
      const date = new Date(timeStr);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      planId.value = parseInt(options.planId) || 0;
      itemId.value = parseInt(options.itemId) || 0;
      projectName.value = options.projectName || "训练项目";
      planTitle.value = options.planTitle || "";
      common_vendor.index.setNavigationBarTitle({
        title: "资料管理"
      });
      if (planId.value && itemId.value) {
        fetchMaterialList();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(projectName.value),
        b: common_vendor.t(planTitle.value),
        c: common_vendor.o(chooseFile, "60"),
        d: materialList.value.length > 0
      }, materialList.value.length > 0 ? {
        e: common_vendor.f(materialList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.materialType === 1
          }, item.materialType === 1 ? {
            b: item.imageUrl,
            c: common_vendor.o(($event) => previewImage(item.imageUrl), item.id)
          } : item.materialType === 2 ? common_vendor.e({
            e: item.videoUrl,
            f: item.imageUrl,
            g: item.duration
          }, item.duration ? {
            h: common_vendor.t(formatDuration(item.duration))
          } : {}) : {}, {
            d: item.materialType === 2,
            i: common_vendor.t(item.title || "未命名资料"),
            j: item.description
          }, item.description ? {
            k: common_vendor.t(item.description)
          } : {}, {
            l: common_vendor.t(formatTime(item.createTime)),
            m: common_vendor.o(($event) => deleteMaterial(item, index), item.id),
            n: item.id
          });
        })
      } : {}, {
        f: showUploadModal.value
      }, showUploadModal.value ? common_vendor.e({
        g: common_vendor.o(closeUploadModal, "72"),
        h: tempFilePath.value
      }, tempFilePath.value ? common_vendor.e({
        i: uploadForm.value.materialType === 1
      }, uploadForm.value.materialType === 1 ? {
        j: tempFilePath.value
      } : {
        k: tempFilePath.value
      }) : {}, {
        l: common_vendor.t(materialTypeOptions[uploadForm.value.materialType - 1]),
        m: materialTypeOptions,
        n: uploadForm.value.materialType - 1,
        o: common_vendor.o(onMaterialTypeChange, "13"),
        p: uploadForm.value.title,
        q: common_vendor.o(($event) => uploadForm.value.title = $event.detail.value, "a8"),
        r: uploadForm.value.description,
        s: common_vendor.o(($event) => uploadForm.value.description = $event.detail.value, "e2"),
        t: common_vendor.o(closeUploadModal, "90"),
        v: common_vendor.o(uploadMaterial, "01"),
        w: common_vendor.o(() => {
        }, "82"),
        x: common_vendor.o(closeUploadModal, "b5")
      }) : {});
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/material-manage/material-manage.js.map
