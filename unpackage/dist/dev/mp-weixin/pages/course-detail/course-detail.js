"use strict";
const common_vendor = require("../../common/vendor.js");
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
  __name: "course-detail",
  setup(__props) {
    const courseId = common_vendor.ref(0);
    const course = common_vendor.reactive({
      id: 0,
      name: "",
      courseClass: "",
      semester: "",
      courseTime: "",
      teacherName: "",
      description: ""
    });
    const classCount = common_vendor.ref(0);
    const lessonCount = common_vendor.ref(0);
    const getCourseDetail = () => {
      const token = common_vendor.index.getStorageSync("token");
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/get?id=${courseId.value}`,
        method: "GET",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        success: (res) => {
          if (res.data.code === 0 && res.data.data) {
            const data = res.data.data;
            course.id = data.id;
            course.name = data.name;
            course.courseClass = data.courseClass;
            course.semester = data.semester;
            course.courseTime = data.courseTime;
            course.teacherName = data.teacherName;
            course.description = data.description;
            common_vendor.index.setNavigationBarTitle({
              title: data.name || "课程详情"
            });
          }
        }
      });
    };
    const getClassCount = () => {
      const token = common_vendor.index.getStorageSync("token");
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/list-classes`,
        method: "GET",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        data: { courseId: courseId.value },
        success: (res) => {
          if (res.data.code === 0 && res.data.data) {
            classCount.value = res.data.data.length;
          }
        }
      });
    };
    const getLessonCount = () => {
      const token = common_vendor.index.getStorageSync("token");
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/list-lessons`,
        method: "GET",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        data: { courseId: courseId.value },
        success: (res) => {
          if (res.data.code === 0 && res.data.data) {
            lessonCount.value = res.data.data.length;
          }
        }
      });
    };
    const goToLessonList = () => {
      common_vendor.index.navigateTo({
        url: `/pages/lesson-list/lesson-list?courseId=${courseId.value}&courseName=${course.name}`
      });
    };
    const showDeleteConfirm = () => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除课程"${course.name}"吗？删除后无法恢复。`,
        confirmColor: "#ff4d4f",
        success: (res) => {
          if (res.confirm) {
            deleteCourse();
          }
        }
      });
    };
    const deleteCourse = () => {
      const token = common_vendor.index.getStorageSync("token");
      common_vendor.index.showLoading({ title: "删除中..." });
      common_vendor.index.request({
        url: `${BASE_URL}/teaching/course/delete?id=${courseId.value}`,
        method: "DELETE",
        header: {
          "Authorization": `Bearer ${token}`,
          "Tenant-Id": "1"
        },
        success: (res) => {
          common_vendor.index.hideLoading();
          if (res.data.code === 0) {
            common_vendor.index.showToast({
              title: "删除成功",
              icon: "success",
              complete: () => {
                setTimeout(() => {
                  common_vendor.index.navigateBack();
                }, 500);
              }
            });
          } else {
            common_vendor.index.showToast({ title: res.data.msg || "删除失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/course-detail/course-detail.vue:222", "删除失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      courseId.value = parseInt(options.courseId) || 0;
      if (courseId.value) {
        getCourseDetail();
        getClassCount();
        getLessonCount();
      }
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          title: "课程详情"
        }),
        b: common_vendor.t(course.name),
        c: common_vendor.t(course.courseClass || "未设置班级"),
        d: common_vendor.t(course.semester || "--"),
        e: common_vendor.t(course.courseTime || "--"),
        f: common_vendor.t(course.teacherName || "--"),
        g: common_vendor.t(course.description || "暂无简介"),
        h: common_vendor.t(classCount.value),
        i: common_vendor.t(lessonCount.value),
        j: common_vendor.o(goToLessonList, "7e"),
        k: common_vendor.o(showDeleteConfirm, "76")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ec6960e7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/course-detail/course-detail.js.map
