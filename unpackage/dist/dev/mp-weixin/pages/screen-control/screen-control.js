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
    const socketOpen = common_vendor.ref(false);
    const statusLine = common_vendor.ref("");
    const showDebug = common_vendor.ref(true);
    const debugLogs = common_vendor.ref([]);
    const logScrollTop = common_vendor.ref(0);
    const connectionPhase = common_vendor.computed(() => {
      if (socketJoined.value)
        return "joined";
      if (connecting.value && socketOpen.value)
        return "open";
      if (connecting.value)
        return "connecting";
      return "idle";
    });
    const phaseLabel = common_vendor.computed(() => {
      const map = {
        idle: "未连接",
        connecting: "握手中…",
        open: "已握手，等待 joined",
        joined: "已加入房间"
      };
      return map[connectionPhase.value] || "未知";
    });
    const phaseClass = common_vendor.computed(() => `phase-${connectionPhase.value}`);
    function pad2(n) {
      return String(n).padStart(2, "0");
    }
    function nowStr() {
      const d = /* @__PURE__ */ new Date();
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    }
    function pushLog(level, tag, msg, detail) {
      const row = { level, tag, msg, time: nowStr() };
      if (detail !== void 0) {
        try {
          row.msg += ` ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
        } catch {
          row.msg += " [detail]";
        }
      }
      debugLogs.value.push(row);
      if (debugLogs.value.length > 80)
        debugLogs.value.shift();
      logScrollTop.value = debugLogs.value.length * 999;
      common_vendor.index.__f__("log", "at pages/screen-control/screen-control.vue:152", `[screen-control][${tag}]`, msg, detail ?? "");
    }
    function clearDebugLogs() {
      debugLogs.value = [];
      logScrollTop.value = 0;
    }
    const DIGITS4 = /^\d{4}$/;
    function normalizeDigits4(value) {
      return String(value ?? "").replace(/\D/g, "").slice(0, 4);
    }
    function normalizeRoomFields() {
      roomId.value = normalizeDigits4(roomId.value);
      token.value = normalizeDigits4(token.value);
    }
    function pasteJoinInfo() {
      common_vendor.index.getClipboardData({
        success: (res) => {
          const text = String(res.data || "").trim();
          if (!text) {
            common_vendor.index.showToast({ title: "剪贴板为空", icon: "none" });
            return;
          }
          const roomMatch = text.match(/房间号[:：]\s*(\d{4})/);
          const tokenMatch = text.match(/令牌[:：]\s*(\d{4})/);
          if (roomMatch && tokenMatch) {
            roomId.value = roomMatch[1];
            token.value = tokenMatch[1];
          } else {
            const digits = text.match(/\d{4}/g);
            if ((digits == null ? void 0 : digits.length) >= 2) {
              roomId.value = digits[0];
              token.value = digits[1];
            } else if ((digits == null ? void 0 : digits.length) === 1) {
              roomId.value = digits[0];
            } else {
              common_vendor.index.showToast({ title: "未找到4位数字", icon: "none" });
              return;
            }
          }
          normalizeRoomFields();
          common_vendor.index.showToast({ title: "已粘贴", icon: "success" });
        },
        fail: () => {
          common_vendor.index.showToast({ title: "无法读取剪贴板", icon: "none" });
        }
      });
    }
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
      pushLog("out", "SEND", obj.type || "raw", obj);
      try {
        common_vendor.index.sendSocketMessage({ data: JSON.stringify(obj) });
      } catch (e) {
        statusLine.value = "发送失败";
        pushLog("error", "SEND", "发送失败", (e == null ? void 0 : e.message) || String(e));
        common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:260", e);
      }
    }
    function sendPingState() {
      pushLog("info", "TEST", "等待服务端 state 广播（下发计划或操控后会收到）");
    }
    function sendCmd(name, payload) {
      sendRaw({ type: "command", name, payload });
    }
    function onSocketMessageHandler(res) {
      var _a, _b, _c, _d;
      pushLog("in", "RECV", "raw", res.data);
      try {
        const msg = JSON.parse(res.data);
        if (msg.type === "joined") {
          socketJoined.value = true;
          connecting.value = false;
          statusLine.value = "已加入房间";
          pushLog("ok", "JOINED", `roomId=${msg.roomId}`, msg);
          try {
            common_vendor.index.setStorageSync("relayWs", relayWs.value.trim());
            common_vendor.index.setStorageSync("relayRoomId", roomId.value.trim());
            common_vendor.index.setStorageSync("relayToken", token.value.trim());
          } catch {
          }
          const authTok = getToken();
          if (authTok)
            sendCmd("setMediaAuth", { token: authTok });
          void pushSetPlan();
          return;
        }
        if (msg.type === "state" && ((_b = (_a = msg.state) == null ? void 0 : _a.plan) == null ? void 0 : _b.length)) {
          planIds.value = msg.state.plan.map((p) => p.id);
          const idx = msg.state.plan.findIndex((p) => p.id === msg.state.currentItemId);
          if (idx >= 0)
            currentIndex.value = idx;
          pushLog("info", "STATE", `plan=${msg.state.plan.length}项 paused=${msg.state.paused}`);
          return;
        }
        if (msg.type === "state") {
          pushLog("info", "STATE", "状态更新", {
            paused: (_c = msg.state) == null ? void 0 : _c.paused,
            currentItemId: (_d = msg.state) == null ? void 0 : _d.currentItemId
          });
          return;
        }
        if (msg.type === "error") {
          if (msg.code === "unauthorized") {
            statusLine.value = "房间号或令牌错误，请核对4位数字";
          } else {
            statusLine.value = msg.message || msg.code || "错误";
          }
          connecting.value = false;
          pushLog("error", "ERROR", msg.message || msg.code, msg);
        }
      } catch {
        statusLine.value = "消息解析失败";
        pushLog("error", "PARSE", "消息解析失败", res.data);
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
        socketOpen.value = true;
        pushLog("ok", "OPEN", relayWs.value.trim());
        sendRaw({
          type: "join",
          role: "mobile",
          roomId: roomId.value.trim(),
          token: token.value.trim()
        });
      });
      common_vendor.index.onSocketMessage(onSocketMessageHandler);
      common_vendor.index.onSocketError((err) => {
        statusLine.value = "WebSocket 错误";
        connecting.value = false;
        socketOpen.value = false;
        pushLog("error", "WS_ERR", "WebSocket 错误", (err == null ? void 0 : err.errMsg) || err);
      });
      common_vendor.index.onSocketClose((res) => {
        socketJoined.value = false;
        connecting.value = false;
        socketOpen.value = false;
        statusLine.value = "连接已关闭";
        pushLog("warn", "CLOSE", `code=${(res == null ? void 0 : res.code) ?? "-"} reason=${(res == null ? void 0 : res.reason) || "-"}`, res);
      });
    }
    function handleDisconnect() {
      pushLog("info", "DISCONNECT", "主动断开");
      clearSocketListeners();
      try {
        common_vendor.index.closeSocket();
      } catch {
      }
      socketJoined.value = false;
      connecting.value = false;
      socketOpen.value = false;
      statusLine.value = "已断开";
    }
    function handleConnect() {
      if (socketJoined.value)
        return;
      normalizeRoomFields();
      if (!relayWs.value.trim()) {
        common_vendor.index.showToast({ title: "请填写 WS 地址", icon: "none" });
        return;
      }
      if (!DIGITS4.test(roomId.value) || !DIGITS4.test(token.value)) {
        common_vendor.index.showToast({ title: "房间号与令牌均为4位数字", icon: "none" });
        return;
      }
      statusLine.value = "";
      connecting.value = true;
      socketOpen.value = false;
      pushLog("info", "CONNECT", relayWs.value.trim(), {
        roomId: roomId.value,
        token: token.value
      });
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
          socketOpen.value = false;
          statusLine.value = "无法发起连接";
          pushLog("error", "CONNECT", "无法发起连接", (err == null ? void 0 : err.errMsg) || err);
          common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:404", err);
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
        const mediaTok = getToken();
        if (mediaTok)
          sendCmd("setMediaAuth", { token: mediaTok });
        sendCmd("setPlan", { plan, currentItemId: plan[0].id, mediaBearerToken: mediaTok });
        pushLog("out", "setPlan", `下发 ${plan.length} 项`, { currentItemId: plan[0].id });
        common_vendor.index.showToast({ title: "计划已下发", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:439", e);
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
      const savedRoom = common_vendor.index.getStorageSync("relayRoomId");
      if (typeof savedRoom === "string" && savedRoom)
        roomId.value = savedRoom;
      const savedToken = common_vendor.index.getStorageSync("relayToken");
      if (typeof savedToken === "string" && savedToken)
        token.value = savedToken;
      common_vendor.index.setNavigationBarTitle({ title: "大屏遥控" });
      pushLog("info", "INIT", `planId=${planId.value} ws=${relayWs.value}`);
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
        c: common_vendor.o(normalizeRoomFields, "d9"),
        d: roomId.value,
        e: common_vendor.o(($event) => roomId.value = $event.detail.value, "bf"),
        f: common_vendor.o(normalizeRoomFields, "32"),
        g: token.value,
        h: common_vendor.o(($event) => token.value = $event.detail.value, "b8"),
        i: common_vendor.o(pasteJoinInfo, "3a"),
        j: common_vendor.t(socketJoined.value ? "已连接" : connecting.value ? "连接中…" : "连接"),
        k: connecting.value,
        l: common_vendor.o(handleConnect, "2b"),
        m: connecting.value || socketJoined.value
      }, connecting.value || socketJoined.value ? {
        n: common_vendor.o(handleDisconnect, "89")
      } : {}, {
        o: common_vendor.t(phaseLabel.value),
        p: common_vendor.n(phaseClass.value),
        q: statusLine.value
      }, statusLine.value ? {
        r: common_vendor.t(statusLine.value)
      } : {}, {
        s: common_vendor.t(showDebug.value ? "收起" : "展开"),
        t: common_vendor.o(($event) => showDebug.value = !showDebug.value, "74"),
        v: showDebug.value
      }, showDebug.value ? common_vendor.e({
        w: common_vendor.o(clearDebugLogs, "8e"),
        x: !socketJoined.value,
        y: common_vendor.o(sendPingState, "60"),
        z: common_vendor.f(debugLogs.value, (row, i, i0) => {
          return {
            a: common_vendor.t(row.time),
            b: common_vendor.t(row.tag),
            c: common_vendor.t(row.msg),
            d: i,
            e: common_vendor.n("log-" + row.level)
          };
        }),
        A: !debugLogs.value.length
      }, !debugLogs.value.length ? {} : {}, {
        B: logScrollTop.value
      }) : {}, {
        C: socketJoined.value
      }, socketJoined.value ? {
        D: common_vendor.t(planTitle.value),
        E: common_vendor.t(planCount.value),
        F: common_vendor.t(loadingPlan.value ? "加载中…" : "重新下发计划"),
        G: loadingPlan.value,
        H: common_vendor.o(pushSetPlan, "40")
      } : {}, {
        I: socketJoined.value && planIds.value.length
      }, socketJoined.value && planIds.value.length ? {
        J: common_vendor.o(($event) => sendCmd("resume"), "28"),
        K: common_vendor.o(($event) => sendCmd("pause"), "e0"),
        L: common_vendor.o(($event) => sendCmd("resetBlockTimer"), "68"),
        M: currentIndex.value <= 0,
        N: common_vendor.o(($event) => shiftItem(-1), "9a"),
        O: currentIndex.value >= planIds.value.length - 1,
        P: common_vendor.o(($event) => shiftItem(1), "45"),
        Q: common_vendor.o(toggleVideo, "99"),
        R: common_vendor.o(endTraining, "a2")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b984102b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/screen-control/screen-control.js.map
