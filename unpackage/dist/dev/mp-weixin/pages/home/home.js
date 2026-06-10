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
  __name: "home",
  setup(__props) {
    const teacherName = common_vendor.ref("");
    const courseGroups = common_vendor.reactive([]);
    const totalClasses = common_vendor.computed(() => {
      return courseGroups.reduce((total, course) => total + course.classes.length, 0);
    });
    const getClassList = (teacherId, token) => {
      teacherName.value = services_trainingPlanApi.getTeacherNameFromStorage() || "老师";
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
          if (res.data.code === 0 && res.data.data) {
            const courses = res.data.data;
            courseGroups.length = 0;
            if (courses.length === 0) {
              common_vendor.index.hideLoading();
              return;
            }
            let completedRequests = 0;
            courses.forEach((course) => {
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
                    const classes = classRes.data.data.map((cls) => ({
                      ...cls,
                      courseId: course.id,
                      id: cls.classId != null ? cls.classId : cls.id
                    }));
                    if (classes.length > 0) {
                      courseGroups.push({
                        courseId: course.id,
                        courseName: course.name,
                        courseClass: course.courseClass,
                        semester: course.semester,
                        courseTime: course.courseTime,
                        classes
                      });
                    }
                  }
                },
                complete: () => {
                  completedRequests++;
                  if (completedRequests === courses.length) {
                    common_vendor.index.hideLoading();
                    courseGroups.sort((a, b) => a.courseId - b.courseId);
                  }
                }
              });
            });
          } else {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: res.data.msg || "获取数据失败", icon: "none" });
          }
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/home/home.vue:164", "请求失败:", err);
          common_vendor.index.showToast({ title: "网络连接异常", icon: "none" });
        }
      });
    };
    const goToClassDetail = (cls) => {
      const cid = cls.classId != null ? cls.classId : cls.id;
      common_vendor.index.navigateTo({
        url: `/pages/class-detail/class-detail?courseId=${cls.courseId}&classId=${cid}&className=${encodeURIComponent(cls.className || "")}`
      });
    };
    const goToMyCourses = () => {
      common_vendor.index.switchTab({
        url: "/pages/my-courses/my-courses"
      });
    };
    const loadPage = async () => {
      try {
        const { teacherId, token } = await services_userProfile.ensureTeacherSession();
        getClassList(teacherId, token);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/home/home.vue:190", err);
        common_vendor.index.showToast({ title: (err == null ? void 0 : err.message) || "请先登录", icon: "none" });
      }
    };
    common_vendor.onShow(() => {
      loadPage();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "羽毛球教学",
          ["show-back"]: false
        }),
        b: common_vendor.t(teacherName.value),
        c: common_vendor.t(totalClasses.value),
        d: courseGroups.length > 0
      }, courseGroups.length > 0 ? {
        e: common_vendor.f(courseGroups, (course, k0, i0) => {
          return {
            a: common_vendor.t(course.courseName),
            b: common_vendor.t(course.courseClass),
            c: common_vendor.f(course.classes, (cls, k1, i1) => {
              return {
                a: common_vendor.t(cls.className),
                b: common_vendor.t(cls.studentCount || 0),
                c: cls.classId ?? cls.id,
                d: common_vendor.o(($event) => goToClassDetail(cls), cls.classId ?? cls.id)
              };
            }),
            d: common_vendor.t(course.semester || "--"),
            e: common_vendor.t(course.courseTime || "--"),
            f: course.courseId
          };
        })
      } : {
        f: common_vendor.o(goToMyCourses, "62")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-07e72d3c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
