"use strict";
const common_vendor = require("../../common/vendor.js");
const services_userProfile = require("../../services/userProfile.js");
const services_trainingPlanApi = require("../../services/trainingPlanApi.js");
if (!Array) {
  const _easycom_page_nav_bar2 = common_vendor.resolveComponent("page-nav-bar");
  _easycom_page_nav_bar2();
}
const _easycom_page_nav_bar = () => "../../components/page-nav-bar/page-nav-bar.js";
if (!Math) {
  _easycom_page_nav_bar();
}
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "my-courses",
  setup(__props) {
    const courseList = common_vendor.reactive([]);
    const showModal = common_vendor.ref(false);
    const semesterOptions = ["2024-2025学年第一学期", "2024-2025学年第二学期", "2025-2026学年第一学期"];
    const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + "时");
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0") + "分");
    const timeRange = [weekDays, hours, minutes];
    const startTimeIndex = common_vendor.ref([0, 8, 0]);
    const endTimeIndex = common_vendor.ref([0, 9, 30]);
    const form = common_vendor.reactive({
      name: "",
      courseClass: "",
      semester: "",
      startTime: "",
      endTime: ""
    });
    const formatTimeDisplay = (value) => {
      const weekDay = weekDays[value[0]];
      const hour = hours[value[1]].replace("时", "");
      const minute = minutes[value[2]].replace("分", "");
      return `${weekDay} ${hour}:${minute}`;
    };
    const convertToDateTime = (value) => {
      const now = /* @__PURE__ */ new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDate = now.getDate();
      const currentDay = now.getDay();
      const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;
      const targetDay = value[0] + 1;
      let diff = targetDay - adjustedCurrentDay;
      if (diff < 0) {
        diff += 7;
      }
      const targetDate = new Date(currentYear, currentMonth, currentDate + diff);
      const year = targetDate.getFullYear();
      const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
      const day = targetDate.getDate().toString().padStart(2, "0");
      const hour = hours[value[1]].replace("时", "");
      const minute = minutes[value[2]].replace("分", "");
      return `${year}-${month}-${day} ${hour}:${minute}:00`;
    };
    const getCourseList = async () => {
      let teacherId;
      let token;
      try {
        ({ teacherId, token } = await services_userProfile.ensureTeacherSession());
      } catch (err) {
        common_vendor.index.showToast({ title: (err == null ? void 0 : err.message) || "请先登录", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "加载中..." });
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/list-by-teacher`,
        method: "GET",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        data: { teacherId },
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.data.code === 0 && res.data.data) {
            courseList.length = 0;
            const courses = res.data.data;
            if (courses.length === 0)
              return;
            courses.forEach((course) => {
              courseList.push({
                ...course,
                classCount: 0
                // 稍后获取
              });
              common_vendor.index.request({
                url: `${BASE_URL}/teaching/course/list-classes`,
                method: "GET",
                header: {
                  "Authorization": `Bearer ${token}`,
                  "Tenant-Id": "1"
                },
                data: { courseId: course.id },
                success: (classRes) => {
                  if (classRes.data.code === 0 && classRes.data.data) {
                    const idx = courseList.findIndex((c) => c.id === course.id);
                    if (idx !== -1) {
                      courseList[idx].classCount = classRes.data.data.length;
                    }
                  }
                }
              });
            });
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "获取课程失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/my-courses/my-courses.vue:237", "请求失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const showCreateModal = () => {
      form.name = "";
      form.courseClass = "";
      form.semester = "";
      form.startTime = "";
      form.endTime = "";
      startTimeIndex.value = [0, 8, 0];
      endTimeIndex.value = [0, 9, 30];
      showModal.value = true;
    };
    const closeModal = () => {
      showModal.value = false;
    };
    const onSemesterChange = (e) => {
      form.semester = semesterOptions[e.detail.value];
    };
    const onStartTimeChange = (e) => {
      startTimeIndex.value = e.detail.value;
      form.startTime = convertToDateTime(e.detail.value);
    };
    const onEndTimeChange = (e) => {
      endTimeIndex.value = e.detail.value;
      form.endTime = convertToDateTime(e.detail.value);
    };
    const createCourse = () => {
      if (!form.name.trim()) {
        common_vendor.index.showToast({ title: "请输入课程名称", icon: "none" });
        return;
      }
      if (!form.courseClass.trim()) {
        common_vendor.index.showToast({ title: "请输入班级名称", icon: "none" });
        return;
      }
      if (!form.semester) {
        common_vendor.index.showToast({ title: "请选择学期", icon: "none" });
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
      const teacherId = services_trainingPlanApi.getTeacherIdFromStorage();
      const token = common_vendor.index.getStorageSync("token");
      if (!teacherId || !token) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      const courseTime = `${form.startTime} 至 ${form.endTime}`;
      common_vendor.index.showLoading({ title: "创建中..." });
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/create`,
        method: "POST",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1",
          "Content-Type": "application/json"
        },
        data: {
          teacherId,
          name: form.name,
          courseClass: form.courseClass,
          semester: form.semester,
          courseTime
        },
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.data.code === 0) {
            common_vendor.index.showToast({ title: "创建成功", icon: "success" });
            closeModal();
            getCourseList();
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "创建失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/my-courses/my-courses.vue:340", "创建失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const goToCourseDetail = (course) => {
      common_vendor.index.navigateTo({
        url: `/pages/course-detail/course-detail?courseId=${course.id}`
      });
    };
    common_vendor.onShow(() => {
      getCourseList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "我的课程",
          ["show-back"]: false
        }),
        b: courseList.length > 0
      }, courseList.length > 0 ? {
        c: common_vendor.f(courseList, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.classCount || 0),
            c: common_vendor.t(item.semester || "--"),
            d: item.id,
            e: common_vendor.o(($event) => goToCourseDetail(item), item.id)
          };
        })
      } : {}, {
        d: common_vendor.o(showCreateModal, "10"),
        e: showModal.value
      }, showModal.value ? {
        f: common_vendor.o(closeModal, "e8"),
        g: form.name,
        h: common_vendor.o(($event) => form.name = $event.detail.value, "9e"),
        i: form.courseClass,
        j: common_vendor.o(($event) => form.courseClass = $event.detail.value, "9f"),
        k: common_vendor.t(form.semester || "请选择学期"),
        l: !form.semester ? 1 : "",
        m: semesterOptions,
        n: common_vendor.o(onSemesterChange, "81"),
        o: common_vendor.t(form.startTime ? formatTimeDisplay(startTimeIndex.value) : "请选择开始时间"),
        p: !form.startTime ? 1 : "",
        q: timeRange,
        r: startTimeIndex.value,
        s: common_vendor.o(onStartTimeChange, "35"),
        t: common_vendor.t(form.endTime ? formatTimeDisplay(endTimeIndex.value) : "请选择结束时间"),
        v: !form.endTime ? 1 : "",
        w: timeRange,
        x: endTimeIndex.value,
        y: common_vendor.o(onEndTimeChange, "f5"),
        z: common_vendor.o(closeModal, "2d"),
        A: common_vendor.o(createCourse, "d8"),
        B: common_vendor.o(() => {
        }, "38"),
        C: common_vendor.o(closeModal, "72")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b97ca3f0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/my-courses/my-courses.js.map
