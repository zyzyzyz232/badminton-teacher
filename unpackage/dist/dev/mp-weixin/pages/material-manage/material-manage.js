"use strict";
const common_vendor = require("../../common/vendor.js");
const API_BASE = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "material-manage",
  setup(__props) {
    const statusBarHeight = common_vendor.ref(0);
    try {
      statusBarHeight.value = common_vendor.index.getSystemInfoSync().statusBarHeight || 0;
    } catch {
      statusBarHeight.value = 0;
    }
    const listHeight = common_vendor.computed(() => {
      const top = statusBarHeight.value + 44 + 120;
      return `calc(100vh - ${top}px)`;
    });
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
    const getToken = () => common_vendor.index.getStorageSync("token") || "";
    const authHeader = () => ({
      Authorization: `Bearer ${getToken()}`,
      "Tenant-Id": "1"
    });
    const goBack = () => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        common_vendor.index.navigateBack();
        return;
      }
      common_vendor.index.navigateBack({
        fail: () => {
          common_vendor.index.redirectTo({ url: "/pages/training-plan/training-plan" });
        }
      });
    };
    const fetchMaterialList = async () => {
      try {
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await common_vendor.index.request({
          url: `${API_BASE}/teaching/plan-material/list-by-item`,
          method: "GET",
          header: authHeader(),
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
        common_vendor.index.__f__("log", "at pages/material-manage/material-manage.vue:240", "获取资料列表失败", e);
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
          },
          fail: () => {
            common_vendor.index.showToast({ title: "未选择图片", icon: "none" });
          }
        });
      } else {
        common_vendor.index.chooseVideo({
          success: (res) => {
            tempFilePath.value = res.tempFilePath;
            showUploadModal.value = true;
          },
          fail: () => {
            common_vendor.index.showToast({ title: "未选择视频", icon: "none" });
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
    const setMaterialType = (type) => {
      uploadForm.value.materialType = type;
    };
    const changeMaterialType = (item) => {
      common_vendor.index.showActionSheet({
        itemList: materialTypeOptions,
        success: (res) => {
          const newType = res.tapIndex + 1;
          if (newType === item.materialType)
            return;
          doUpdateMaterialType(item, newType);
        }
      });
    };
    const doUpdateMaterialType = async (item, materialType) => {
      var _a, _b;
      try {
        common_vendor.index.showLoading({ title: "保存中..." });
        const body = {
          id: item.id,
          planId: planId.value,
          itemId: itemId.value,
          materialType,
          imageUrl: item.imageUrl || "",
          videoUrl: item.videoUrl || "",
          title: item.title || "",
          description: item.description || "",
          duration: item.duration,
          sortOrder: item.sortOrder
        };
        const res = await common_vendor.index.request({
          url: `${API_BASE}/teaching/plan-material/update`,
          method: "PUT",
          header: {
            ...authHeader(),
            "Content-Type": "application/json"
          },
          data: body
        });
        common_vendor.index.hideLoading();
        if (((_a = res.data) == null ? void 0 : _a.code) === 0) {
          common_vendor.index.showToast({ title: "类型已更新", icon: "success" });
          fetchMaterialList();
        } else {
          common_vendor.index.showToast({ title: ((_b = res.data) == null ? void 0 : _b.msg) || "更新失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/material-manage/material-manage.vue:331", e);
        common_vendor.index.showToast({ title: "更新失败", icon: "none" });
      }
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
          header: authHeader(),
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
        common_vendor.index.__f__("log", "at pages/material-manage/material-manage.vue:372", "上传失败", e);
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
    common_vendor.onLoad((options) => {
      planId.value = parseInt(options == null ? void 0 : options.planId, 10) || 0;
      itemId.value = parseInt(options == null ? void 0 : options.itemId, 10) || 0;
      projectName.value = (options == null ? void 0 : options.projectName) ? decodeURIComponent(options.projectName) : "训练项目";
      planTitle.value = (options == null ? void 0 : options.planTitle) ? decodeURIComponent(options.planTitle) : "";
      if (planId.value && itemId.value) {
        fetchMaterialList();
      } else {
        common_vendor.index.showToast({ title: "参数不完整", icon: "none" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goBack, "9d"),
        b: statusBarHeight.value + "px",
        c: common_vendor.t(projectName.value),
        d: common_vendor.t(planTitle.value),
        e: common_vendor.f(materialTypeOptions, (label, idx, i0) => {
          return {
            a: common_vendor.t(label),
            b: idx,
            c: uploadForm.value.materialType === idx + 1 ? 1 : "",
            d: common_vendor.o(($event) => setMaterialType(idx + 1), idx)
          };
        }),
        f: common_vendor.t(uploadForm.value.materialType === 1 ? "图片" : "视频"),
        g: common_vendor.o(chooseFile, "f8"),
        h: materialList.value.length > 0
      }, materialList.value.length > 0 ? {
        i: common_vendor.f(materialList.value, (item, index, i0) => {
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
            m: common_vendor.o(($event) => changeMaterialType(item), item.id),
            n: common_vendor.o(($event) => deleteMaterial(item, index), item.id),
            o: item.id
          });
        })
      } : {}, {
        j: listHeight.value,
        k: showUploadModal.value
      }, showUploadModal.value ? common_vendor.e({
        l: common_vendor.o(closeUploadModal, "43"),
        m: tempFilePath.value
      }, tempFilePath.value ? common_vendor.e({
        n: uploadForm.value.materialType === 1
      }, uploadForm.value.materialType === 1 ? {
        o: tempFilePath.value
      } : {
        p: tempFilePath.value
      }) : {}, {
        q: common_vendor.f(materialTypeOptions, (label, idx, i0) => {
          return {
            a: common_vendor.t(label),
            b: idx,
            c: uploadForm.value.materialType === idx + 1 ? 1 : "",
            d: common_vendor.o(($event) => setMaterialType(idx + 1), idx)
          };
        }),
        r: uploadForm.value.title,
        s: common_vendor.o(($event) => uploadForm.value.title = $event.detail.value, "83"),
        t: uploadForm.value.description,
        v: common_vendor.o(($event) => uploadForm.value.description = $event.detail.value, "c1"),
        w: common_vendor.o(closeUploadModal, "82"),
        x: common_vendor.o(uploadMaterial, "b8"),
        y: common_vendor.o(() => {
        }, "93"),
        z: common_vendor.o(closeUploadModal, "0d")
      }) : {});
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/material-manage/material-manage.js.map
