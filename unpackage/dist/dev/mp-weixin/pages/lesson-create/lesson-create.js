"use strict";
const common_vendor = require("../../common/vendor.js");
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "lesson-create",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const form = common_vendor.reactive({
      weekIndex: 1,
      startTime: "",
      endTime: "",
      type: 1
    });
    const weekIndex = common_vendor.ref(-1);
    const typeIndex = common_vendor.ref(0);
    const startTimeValue = common_vendor.ref([0, 0, 0, 0, 0]);
    const endTimeValue = common_vendor.ref([0, 0, 0, 0, 0]);
    const weekOptions = Array.from({ length: 16 }, (_, i) => `第${i + 1}周`);
    const typeOptions = ["普通课堂"];
    const years = Array.from({ length: 5 }, (_, i) => 2024 + i + "年");
    const months = Array.from({ length: 12 }, (_, i) => i + 1 + "月");
    const days = Array.from({ length: 31 }, (_, i) => i + 1 + "日");
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + "时");
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0") + "分");
    const dateTimeRange = [years, months, days, hours, minutes];
    const getCurrentDateTimeValue = () => {
      const now = /* @__PURE__ */ new Date();
      return [
        now.getFullYear() - 2024,
        now.getMonth(),
        now.getDate() - 1,
        now.getHours(),
        now.getMinutes()
      ];
    };
    const formatDateTime = (value) => {
      const year = years[value[0]].replace("年", "");
      const month = (value[1] + 1).toString().padStart(2, "0");
      const day = (value[2] + 1).toString().padStart(2, "0");
      const hour = hours[value[3]].replace("时", "");
      const minute = minutes[value[4]].replace("分", "");
      return `${year}-${month}-${day} ${hour}:${minute}:00`;
    };
    const onWeekChange = (e) => {
      weekIndex.value = e.detail.value;
      form.weekIndex = e.detail.value + 1;
    };
    const onTypeChange = (e) => {
      typeIndex.value = e.detail.value;
      form.type = e.detail.value + 1;
    };
    const onStartTimeChange = (e) => {
      startTimeValue.value = e.detail.value;
      form.startTime = formatDateTime(e.detail.value);
    };
    const onStartColumnChange = (e) => {
    };
    const onEndTimeChange = (e) => {
      endTimeValue.value = e.detail.value;
      form.endTime = formatDateTime(e.detail.value);
    };
    const onEndColumnChange = (e) => {
    };
    const createLesson = () => {
      if (weekIndex.value === -1) {
        common_vendor.index.showToast({ title: "请选择周次", icon: "none" });
        return;
      }
      if (!form.startTime) {
        common_vendor.index.showToast({ title: "请选择开始时间", icon: "none" });
        return;
      }
      if (!form.endTime) {
        common_vendor.index.showToast({ title: "请选择结束时间", icon: "none" });
        return;
      }
      const token = common_vendor.index.getStorageSync("token");
      common_vendor.index.showLoading({ title: "创建中..." });
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/lesson/create`,
        method: "POST",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1",
          "Content-Type": "application/json"
        },
        data: {
          courseId: courseId.value,
          weekIndex: form.weekIndex,
          startTime: form.startTime,
          endTime: form.endTime,
          type: form.type
        },
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.data.code === 0) {
            common_vendor.index.showToast({ title: "创建成功", icon: "success" });
            setTimeout(() => {
              common_vendor.index.navigateBack();
            }, 500);
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "创建失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/lesson-create/lesson-create.vue:202", "创建失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      courseId.value = parseInt(options.courseId) || 0;
      classId.value = parseInt(options.classId) || 0;
      className.value = options.className || "班级详情";
      common_vendor.index.setNavigationBarTitle({
        title: "创建课堂"
      });
      const currentValue = getCurrentDateTimeValue();
      startTimeValue.value = [...currentValue];
      endTimeValue.value = [...currentValue];
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(className.value),
        b: common_vendor.t(weekIndex.value >= 0 ? common_vendor.unref(weekOptions)[weekIndex.value] : "请选择周次"),
        c: weekIndex.value === -1 ? 1 : "",
        d: common_vendor.unref(weekOptions),
        e: weekIndex.value,
        f: common_vendor.o(onWeekChange, "08"),
        g: common_vendor.t(form.startTime || "请选择开始时间"),
        h: !form.startTime ? 1 : "",
        i: dateTimeRange,
        j: startTimeValue.value,
        k: common_vendor.o(onStartTimeChange, "08"),
        l: common_vendor.o(onStartColumnChange, "8e"),
        m: common_vendor.t(form.endTime || "请选择结束时间"),
        n: !form.endTime ? 1 : "",
        o: dateTimeRange,
        p: endTimeValue.value,
        q: common_vendor.o(onEndTimeChange, "47"),
        r: common_vendor.o(onEndColumnChange, "ba"),
        s: common_vendor.t(typeOptions[typeIndex.value]),
        t: typeOptions,
        v: typeIndex.value,
        w: common_vendor.o(onTypeChange, "0b"),
        x: common_vendor.o(createLesson, "43")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b4985c21"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/lesson-create/lesson-create.js.map
