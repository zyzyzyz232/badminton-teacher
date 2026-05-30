"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "exam-setup",
  setup(__props) {
    const venueList = common_vendor.ref([
      { id: "1", name: "1号场地", location: "体育馆A区", line: "1号场地 · 体育馆A区" },
      { id: "2", name: "2号场地", location: "体育馆A区", line: "2号场地 · 体育馆A区" },
      { id: "3", name: "3号场地", location: "体育馆A区", line: "3号场地 · 体育馆A区" },
      { id: "4", name: "4号场地", location: "体育馆B区", line: "4号场地 · 体育馆B区" },
      { id: "5", name: "5号场地", location: "体育馆B区", line: "5号场地 · 体育馆B区" },
      { id: "6", name: "6号场地", location: "体育馆B区", line: "6号场地 · 体育馆B区" },
      { id: "7", name: "7号场地", location: "训练馆", line: "7号场地 · 训练馆" },
      { id: "8", name: "8号场地", location: "训练馆", line: "8号场地 · 训练馆" },
      { id: "9", name: "9号场地", location: "训练馆", line: "9号场地 · 训练馆" }
    ]);
    const examTypes = [
      { id: "landing", title: "落点检测", desc: "羽毛球落点智能检测" },
      { id: "action_recognition", title: "动作识别", desc: "技术动作识别与评测" }
    ];
    const courseId = common_vendor.ref(0);
    const classId = common_vendor.ref(0);
    const className = common_vendor.ref("");
    const lessonId = common_vendor.ref(0);
    const lessonWeek = common_vendor.ref(0);
    const venuePickerIndex = common_vendor.ref(0);
    const selectedVenueId = common_vendor.ref(venueList.value[0].id);
    const selectedExamType = common_vendor.ref("");
    const displayClassName = common_vendor.computed(() => className.value || "班级");
    const headerLine = common_vendor.computed(() => {
      const base = displayClassName.value;
      if (lessonWeek.value > 0)
        return `${base} · 第${lessonWeek.value}周`;
      return base;
    });
    const venueDisplayLine = common_vendor.computed(() => {
      const list = venueList.value;
      const v = list[venuePickerIndex.value];
      return v ? v.line : "";
    });
    const canStart = common_vendor.computed(
      () => !!lessonId.value && !!selectedVenueId.value && !!selectedExamType.value
    );
    const confirmBtnLabel = common_vendor.computed(() => {
      if (!lessonId.value)
        return "请从课堂列表选择课堂";
      if (!selectedExamType.value)
        return "请选择考核项目";
      return canStart.value ? "开始考试" : "请选择考核项目";
    });
    const onVenueChange = (e) => {
      const idx = parseInt(e.detail.value, 10);
      const list = venueList.value;
      if (Number.isNaN(idx) || idx < 0 || idx >= list.length)
        return;
      venuePickerIndex.value = idx;
      selectedVenueId.value = list[idx].id;
    };
    function decodeClassName(raw) {
      if (!raw)
        return "";
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    const goToExamSession = () => {
      if (!courseId.value) {
        common_vendor.index.showToast({ title: "缺少课程信息，请返回重试", icon: "none" });
        return;
      }
      if (!classId.value) {
        common_vendor.index.showToast({ title: "缺少班级信息，请返回班级详情重试", icon: "none" });
        return;
      }
      if (!lessonId.value) {
        common_vendor.index.showToast({ title: "缺少课堂，请从课堂列表进入考试", icon: "none" });
        return;
      }
      if (!canStart.value) {
        common_vendor.index.showToast({ title: "请先选择考核项目", icon: "none" });
        return;
      }
      const q = [
        `courseId=${courseId.value}`,
        `classId=${classId.value}`,
        `className=${encodeURIComponent(className.value)}`,
        `lessonId=${lessonId.value}`,
        `venueId=${encodeURIComponent(selectedVenueId.value)}`,
        `venueLabel=${encodeURIComponent(venueDisplayLine.value || "")}`,
        `examType=${encodeURIComponent(selectedExamType.value)}`
      ].join("&");
      common_vendor.index.navigateTo({
        url: `/pages/exam-session/exam-session?${q}`
      });
    };
    function pickQuery(options, ...keys) {
      for (const k of keys) {
        const v = options[k];
        if (v === void 0 || v === null || v === "")
          continue;
        if (Array.isArray(v))
          return v[0];
        return v;
      }
      return "";
    }
    common_vendor.onLoad((options) => {
      options = options || {};
      courseId.value = parseInt(String(pickQuery(options, "courseId") || ""), 10) || 0;
      classId.value = parseInt(String(pickQuery(options, "classId", "class_id") || ""), 10) || 0;
      className.value = decodeClassName(pickQuery(options, "className", "class_name") || "");
      const rawLid = pickQuery(options, "lessonId", "lesson_id");
      lessonId.value = parseInt(String(rawLid || ""), 10) || 0;
      const rawWeek = pickQuery(options, "lessonWeek", "lesson_week");
      lessonWeek.value = parseInt(String(rawWeek || ""), 10) || 0;
      common_vendor.index.setNavigationBarTitle({ title: "考核选项" });
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(headerLine.value),
        b: common_vendor.t(venueDisplayLine.value),
        c: venueList.value,
        d: venuePickerIndex.value,
        e: common_vendor.o(onVenueChange, "2a"),
        f: common_vendor.f(examTypes, (t, k0, i0) => {
          return {
            a: common_vendor.t(t.title),
            b: common_vendor.t(t.desc),
            c: t.id,
            d: selectedExamType.value === t.id ? 1 : "",
            e: common_vendor.o(($event) => selectedExamType.value = t.id, t.id)
          };
        }),
        g: common_vendor.t(confirmBtnLabel.value),
        h: !canStart.value ? 1 : "",
        i: common_vendor.o(goToExamSession, "10")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7d0106c5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-setup/exam-setup.js.map
