"use strict";
const common_vendor = require("../../common/vendor.js");
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "screen-control",
  setup(__props) {
    const relayWs = common_vendor.ref("ws://127.0.0.1:3456");
    const roomId = common_vendor.ref("");
    const token = common_vendor.ref("");
    const connecting = common_vendor.ref(false);
    const socketJoined = common_vendor.ref(false);
    const statusLine = common_vendor.ref("");
    const lessonId = common_vendor.ref(0);
    const planId = common_vendor.ref(0);
    const planTitle = common_vendor.ref("");
    const loadingPlan = common_vendor.ref(false);
    const planIds = common_vendor.ref([]);
    const currentIndex = common_vendor.ref(0);
    const planCount = common_vendor.computed(() => planIds.value.length);
    const getToken = () => common_vendor.index.getStorageSync("token") || "";
    const requestGet = (url, data) => new Promise((resolve, reject) => {
      common_vendor.index.request({
        url,
        method: "GET",
        header: {
          Authorization: `Bearer ${getToken()}`,
          "Tenant-Id": "1"
        },
        data,
        success: (res) => {
          var _a, _b;
          if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 0)
            resolve(res.data.data || []);
          else
            reject(new Error(((_b = res.data) == null ? void 0 : _b.msg) || "请求失败"));
        },
        fail: reject
      });
    });
    function mergePlanPayload(projects, materials) {
      const ps = [...projects].sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
      const ms = [...materials].sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
      return ps.map((p, i) => {
        const m = ms[i] || {};
        const videoUrl = typeof m.videoUrl === "string" && m.videoUrl ? m.videoUrl : void 0;
        const desc = m.description || m.title;
        const instruction = typeof desc === "string" && desc ? desc : void 0;
        const row = {
          id: String(p.id),
          title: p.itemName || `项目${p.id}`,
          durationMin: Math.max(1, Math.round(Number(p.duration)) || 1)
        };
        if (videoUrl)
          row.videoUrl = videoUrl;
        if (instruction)
          row.instruction = instruction;
        return row;
      });
    }
    function sendRaw(obj) {
      try {
        common_vendor.index.sendSocketMessage({ data: JSON.stringify(obj) });
      } catch (e) {
        statusLine.value = "发送失败";
        common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:121", e);
      }
    }
    function sendCmd(name, payload) {
      sendRaw({ type: "command", name, payload });
    }
    function onSocketMessageHandler(res) {
      var _a, _b;
      try {
        const msg = JSON.parse(res.data);
        if (msg.type === "joined") {
          socketJoined.value = true;
          connecting.value = false;
          statusLine.value = "已加入房间";
          try {
            common_vendor.index.setStorageSync("relayWs", relayWs.value.trim());
          } catch {
          }
          void pushSetPlan();
          return;
        }
        if (msg.type === "state" && ((_b = (_a = msg.state) == null ? void 0 : _a.plan) == null ? void 0 : _b.length)) {
          planIds.value = msg.state.plan.map((p) => p.id);
          const idx = msg.state.plan.findIndex((p) => p.id === msg.state.currentItemId);
          if (idx >= 0)
            currentIndex.value = idx;
          return;
        }
        if (msg.type === "error") {
          statusLine.value = msg.message || msg.code || "错误";
          connecting.value = false;
        }
      } catch {
        statusLine.value = "消息解析失败";
      }
    }
    function clearSocketListeners() {
      try {
        common_vendor.index.offSocketOpen();
        common_vendor.index.offSocketMessage();
        common_vendor.index.offSocketError();
        common_vendor.index.offSocketClose();
      } catch {
      }
    }
    function bindSocketListeners() {
      common_vendor.index.onSocketOpen(() => {
        sendRaw({
          type: "join",
          role: "mobile",
          roomId: roomId.value.trim(),
          token: token.value.trim()
        });
      });
      common_vendor.index.onSocketMessage(onSocketMessageHandler);
      common_vendor.index.onSocketError(() => {
        statusLine.value = "WebSocket 错误";
        connecting.value = false;
      });
      common_vendor.index.onSocketClose(() => {
        socketJoined.value = false;
        connecting.value = false;
        statusLine.value = "连接已关闭";
      });
    }
    function handleConnect() {
      if (socketJoined.value)
        return;
      if (!relayWs.value.trim()) {
        common_vendor.index.showToast({ title: "请填写 WS 地址", icon: "none" });
        return;
      }
      if (!roomId.value.trim() || !token.value.trim()) {
        common_vendor.index.showToast({ title: "请填写房间号与令牌", icon: "none" });
        return;
      }
      statusLine.value = "";
      connecting.value = true;
      try {
        common_vendor.index.closeSocket();
      } catch {
      }
      clearSocketListeners();
      bindSocketListeners();
      common_vendor.index.connectSocket({
        url: relayWs.value.trim(),
        fail: (err) => {
          connecting.value = false;
          statusLine.value = "无法发起连接";
          common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:215", err);
        }
      });
    }
    async function pushSetPlan() {
      if (!planId.value) {
        common_vendor.index.showToast({ title: "缺少 planId", icon: "none" });
        return;
      }
      loadingPlan.value = true;
      try {
        const projects = await requestGet(`${BASE_URL}/teaching/plan-project/list-by-plan`, {
          planId: planId.value
        });
        let materials = [];
        try {
          materials = await requestGet(`${BASE_URL}/teaching/plan-material/list-by-plan`, {
            planId: planId.value
          });
        } catch {
          materials = [];
        }
        const plan = mergePlanPayload(projects, materials);
        if (!plan.length) {
          common_vendor.index.showToast({ title: "训练项为空", icon: "none" });
          loadingPlan.value = false;
          return;
        }
        planIds.value = plan.map((p) => p.id);
        currentIndex.value = 0;
        sendCmd("setPlan", { plan, currentItemId: plan[0].id });
        common_vendor.index.showToast({ title: "计划已下发", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:249", e);
        common_vendor.index.showToast({ title: e.message || "加载计划失败", icon: "none" });
      } finally {
        loadingPlan.value = false;
      }
    }
    function shiftItem(delta) {
      const next = currentIndex.value + delta;
      if (next < 0 || next >= planIds.value.length)
        return;
      currentIndex.value = next;
      sendCmd("setCurrentItem", { id: planIds.value[next] });
    }
    function toggleVideo() {
      sendCmd("toggleVideo");
    }
    function endTraining() {
      sendCmd("pause");
      sendCmd("setVideoPlaying", { playing: false });
    }
    common_vendor.onMounted(() => {
      var _a;
      const pages = getCurrentPages();
      const opts = ((_a = pages[pages.length - 1]) == null ? void 0 : _a.options) || {};
      lessonId.value = parseInt(opts.lessonId, 10) || 0;
      planId.value = parseInt(opts.planId, 10) || 0;
      planTitle.value = decodeURIComponent(opts.planTitle || "");
      const savedWs = common_vendor.index.getStorageSync("relayWs");
      if (typeof savedWs === "string" && savedWs)
        relayWs.value = savedWs;
      common_vendor.index.setNavigationBarTitle({ title: "大屏遥控" });
    });
    common_vendor.onUnmounted(() => {
      clearSocketListeners();
      try {
        common_vendor.index.closeSocket();
      } catch {
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: relayWs.value,
        b: common_vendor.o(($event) => relayWs.value = $event.detail.value, "52"),
        c: roomId.value,
        d: common_vendor.o(($event) => roomId.value = $event.detail.value, "f6"),
        e: token.value,
        f: common_vendor.o(($event) => token.value = $event.detail.value, "85"),
        g: common_vendor.t(socketJoined.value ? "已连接" : connecting.value ? "连接中…" : "连接"),
        h: connecting.value,
        i: common_vendor.o(handleConnect, "65"),
        j: statusLine.value
      }, statusLine.value ? {
        k: common_vendor.t(statusLine.value)
      } : {}, {
        l: socketJoined.value
      }, socketJoined.value ? {
        m: common_vendor.t(planTitle.value),
        n: common_vendor.t(planCount.value),
        o: common_vendor.t(loadingPlan.value ? "加载中…" : "重新下发计划"),
        p: loadingPlan.value,
        q: common_vendor.o(pushSetPlan, "38")
      } : {}, {
        r: socketJoined.value && planIds.value.length
      }, socketJoined.value && planIds.value.length ? {
        s: common_vendor.o(($event) => sendCmd("resume"), "2c"),
        t: common_vendor.o(($event) => sendCmd("pause"), "f3"),
        v: common_vendor.o(($event) => sendCmd("resetBlockTimer"), "45"),
        w: currentIndex.value <= 0,
        x: common_vendor.o(($event) => shiftItem(-1), "88"),
        y: currentIndex.value >= planIds.value.length - 1,
        z: common_vendor.o(($event) => shiftItem(1), "c0"),
        A: common_vendor.o(toggleVideo, "0b"),
        B: common_vendor.o(endTraining, "1e")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b984102b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/screen-control/screen-control.js.map
