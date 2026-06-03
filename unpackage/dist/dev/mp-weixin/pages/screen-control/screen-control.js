"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_platform = require("../../utils/platform.js");
const utils_relayConfig = require("../../utils/relayConfig.js");
const BASE_URL = "http://10.112.189.54:48080/admin-api";
const _sfc_main = {
  __name: "screen-control",
  setup(__props) {
    const relayWs = common_vendor.ref(utils_relayConfig.resolveRelayWsUrl());
    const roomId = common_vendor.ref(utils_relayConfig.RELAY_ROOM_ID_DEFAULT);
    const token = common_vendor.ref(utils_relayConfig.RELAY_TOKEN_DEFAULT);
    const connecting = common_vendor.ref(false);
    const socketJoined = common_vendor.ref(false);
    const socketOpen = common_vendor.ref(false);
    const statusLine = common_vendor.ref("");
    const showDebug = common_vendor.ref(false);
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
      common_vendor.index.__f__("log", "at pages/screen-control/screen-control.vue:133", `[screen-control][${tag}]`, msg, detail ?? "");
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
      persistRelayCredentials();
    }
    function loadRelayCredentials() {
      const savedWs = common_vendor.index.getStorageSync(utils_relayConfig.RELAY_STORAGE_KEYS.ws);
      const savedRoom = common_vendor.index.getStorageSync(utils_relayConfig.RELAY_STORAGE_KEYS.roomId);
      const savedToken = common_vendor.index.getStorageSync(utils_relayConfig.RELAY_STORAGE_KEYS.token);
      relayWs.value = utils_relayConfig.resolveRelayWsUrl(typeof savedWs === "string" ? savedWs : "");
      roomId.value = normalizeDigits4(
        typeof savedRoom === "string" && savedRoom ? savedRoom : utils_relayConfig.RELAY_ROOM_ID_DEFAULT
      );
      token.value = normalizeDigits4(
        typeof savedToken === "string" && savedToken ? savedToken : utils_relayConfig.RELAY_TOKEN_DEFAULT
      );
    }
    function persistRelayCredentials() {
      try {
        const ws = relayWs.value.trim();
        if (ws)
          common_vendor.index.setStorageSync(utils_relayConfig.RELAY_STORAGE_KEYS.ws, ws);
        if (DIGITS4.test(roomId.value))
          common_vendor.index.setStorageSync(utils_relayConfig.RELAY_STORAGE_KEYS.roomId, roomId.value);
        if (DIGITS4.test(token.value))
          common_vendor.index.setStorageSync(utils_relayConfig.RELAY_STORAGE_KEYS.token, token.value);
      } catch {
      }
    }
    function canAutoConnect() {
      return planId.value > 0 && !socketJoined.value && !connecting.value && !!relayWs.value.trim() && DIGITS4.test(roomId.value) && DIGITS4.test(token.value);
    }
    const lessonId = common_vendor.ref(0);
    const planId = common_vendor.ref(0);
    const planTitle = common_vendor.ref("");
    const loadingPlan = common_vendor.ref(false);
    const planIds = common_vendor.ref([]);
    const currentIndex = common_vendor.ref(0);
    const planCount = common_vendor.computed(() => planIds.value.length);
    const getToken = () => common_vendor.index.getStorageSync("token") || "";
    function buildUrlWithQuery(url, query) {
      const parts = [];
      for (const [k, v] of Object.entries(query || {})) {
        if (v === void 0 || v === null || v === "")
          continue;
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
      return parts.length ? `${url}?${parts.join("&")}` : url;
    }
    const requestGet = (url, data) => new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: data ? buildUrlWithQuery(url, data) : url,
        method: "GET",
        header: {
          Authorization: `Bearer ${getToken()}`,
          "Tenant-Id": "1"
        },
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
    function resolveProjectItemId(project) {
      if (!project || typeof project !== "object")
        return "";
      const raw = project.itemId != null && project.itemId !== "" ? project.itemId : project.id;
      if (raw == null || raw === "")
        return "";
      const s = String(raw).trim();
      if (!s || s === "undefined" || s === "null")
        return "";
      return s;
    }
    function comparePlanProjects(a, b) {
      const ao = a.sortOrder;
      const bo = b.sortOrder;
      if (ao != null && bo != null && Number(ao) !== Number(bo)) {
        return Number(ao) - Number(bo);
      }
      const ai = resolveProjectItemId(a);
      const bi = resolveProjectItemId(b);
      return ai.localeCompare(bi, void 0, { numeric: true });
    }
    function mapProjectToPlanItem(project, materials) {
      const ms = [...materials || []].sort(
        (a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id)
      );
      const m = ms.find((row2) => typeof row2.videoUrl === "string" && row2.videoUrl) || ms[0] || {};
      const videoUrl = typeof m.videoUrl === "string" && m.videoUrl ? m.videoUrl : void 0;
      const desc = m.description || m.title;
      const instruction = typeof desc === "string" && desc ? desc : void 0;
      const pid = resolveProjectItemId(project);
      const row = {
        id: pid || String(project.id ?? ""),
        title: project.itemName || `项目${pid || project.id}`,
        durationMin: Math.max(1, Math.round(Number(project.duration)) || 1)
      };
      if (videoUrl)
        row.videoUrl = videoUrl;
      if (instruction)
        row.instruction = instruction;
      return row;
    }
    async function fetchPlanPayloadForScreen(pid) {
      const projects = await requestGet(`${BASE_URL}/teaching/plan-project/list-by-plan`, {
        planId: pid
      });
      const sorted = [...projects].sort(comparePlanProjects);
      const plan = await Promise.all(
        sorted.map(async (p) => {
          const itemId = resolveProjectItemId(p);
          let materials = [];
          if (itemId) {
            try {
              materials = await requestGet(`${BASE_URL}/teaching/plan-material/list-by-item`, {
                planId: String(pid),
                itemId
              });
              pushLog("info", "MATERIAL", `list-by-item planId=${pid} itemId=${itemId}`);
            } catch {
              materials = [];
            }
          }
          return mapProjectToPlanItem(p, materials);
        })
      );
      return plan;
    }
    function sendRaw(obj) {
      pushLog("out", "SEND", obj.type || "raw", obj);
      try {
        common_vendor.index.sendSocketMessage({ data: JSON.stringify(obj) });
      } catch (e) {
        statusLine.value = "发送失败";
        pushLog("error", "SEND", "发送失败", (e == null ? void 0 : e.message) || String(e));
        common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:301", e);
      }
    }
    function sendPingState() {
      pushLog("info", "TEST", "等待服务端 state 广播（下发计划或操控后会收到）");
    }
    function sendCmd(name, payload) {
      sendRaw({ type: "command", name, payload });
    }
    function onSocketMessageHandler(res) {
      var _a, _b, _c, _d, _e;
      pushLog("in", "RECV", "raw", res.data);
      try {
        const msg = JSON.parse(res.data);
        if (msg.type === "joined") {
          socketJoined.value = true;
          connecting.value = false;
          statusLine.value = "已加入房间";
          pushLog("ok", "JOINED", `roomId=${msg.roomId}`, msg);
          persistRelayCredentials();
          const authTok = getToken();
          if (authTok) {
            sendCmd("setMediaAuth", { token: authTok, tenantId: "1" });
            pushLog("out", "setMediaAuth", "已同步视频访问令牌");
          }
          void pushSetPlan();
          return;
        }
        if (msg.type === "state" && ((_b = (_a = msg.state) == null ? void 0 : _a.plan) == null ? void 0 : _b.length)) {
          planIds.value = msg.state.plan.map((p) => p.id);
          const idx = msg.state.plan.findIndex((p) => p.id === msg.state.currentItemId);
          if (idx >= 0)
            currentIndex.value = idx;
          const cur = msg.state.plan.find((p) => p.id === msg.state.currentItemId) || msg.state.plan[0];
          const hasToken = !!(msg.state.mediaBearerToken && String(msg.state.mediaBearerToken).length);
          pushLog("info", "STATE", `plan=${msg.state.plan.length} paused=${msg.state.paused} videoPlaying=${msg.state.videoPlaying}`);
          pushLog("info", "VIDEO", `token=${hasToken ? "有" : "无"} url=${(cur == null ? void 0 : cur.videoUrl) ? "有" : "无"}`, {
            videoUrl: (cur == null ? void 0 : cur.videoUrl) || "",
            tokenPrefix: hasToken ? String(msg.state.mediaBearerToken).slice(0, 8) : ""
          });
          return;
        }
        if (msg.type === "state") {
          pushLog("info", "STATE", "状态更新", {
            paused: (_c = msg.state) == null ? void 0 : _c.paused,
            currentItemId: (_d = msg.state) == null ? void 0 : _d.currentItemId,
            videoPlaying: (_e = msg.state) == null ? void 0 : _e.videoPlaying
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
      persistRelayCredentials();
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
          common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:438", err);
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
        const plan = await fetchPlanPayloadForScreen(planId.value);
        if (!plan.length) {
          common_vendor.index.showToast({ title: "训练项为空", icon: "none" });
          loadingPlan.value = false;
          return;
        }
        planIds.value = plan.map((p) => p.id);
        currentIndex.value = 0;
        const mediaTok = getToken();
        const withVideo = plan.filter((p) => p.videoUrl).length;
        sendCmd("setPlan", {
          plan,
          currentItemId: plan[0].id,
          mediaBearerToken: mediaTok
        });
        pushLog("out", "setPlan", `下发 ${plan.length} 项，含视频 ${withVideo} 项`, {
          currentItemId: plan[0].id,
          videoUrl: plan[0].videoUrl || "(无)",
          hasMediaToken: !!mediaTok,
          tokenPrefix: mediaTok ? mediaTok.slice(0, 8) : ""
        });
        common_vendor.index.showToast({ title: "计划已下发", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/screen-control/screen-control.vue:473", e);
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
      pushLog("out", "toggleVideo", "已发送 视频开/关（大屏 videoPlaying 将切换）");
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
      if (utils_platform.isH5Client() && (!planId.value || planId.value <= 0)) {
        common_vendor.index.showToast({ title: "请从「选择训练计划」进入遥控", icon: "none", duration: 2500 });
        setTimeout(() => {
          const token2 = common_vendor.index.getStorageSync("token");
          if (token2)
            common_vendor.index.switchTab({ url: "/pages/home/home" });
          else
            common_vendor.index.reLaunch({ url: "/pages/index/index" });
        }, 400);
        return;
      }
      loadRelayCredentials();
      if (!common_vendor.index.getStorageSync(utils_relayConfig.RELAY_STORAGE_KEYS.roomId)) {
        persistRelayCredentials();
      }
      common_vendor.index.setNavigationBarTitle({ title: "大屏遥控" });
      pushLog("info", "INIT", `planId=${planId.value} ws=${relayWs.value} room=${roomId.value}`);
      if (canAutoConnect()) {
        setTimeout(() => {
          if (canAutoConnect())
            handleConnect();
        }, 400);
      }
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
        a: !socketJoined.value
      }, !socketJoined.value ? common_vendor.e({
        b: common_vendor.t(phaseLabel.value),
        c: common_vendor.n(phaseClass.value),
        d: statusLine.value
      }, statusLine.value ? {
        e: common_vendor.t(statusLine.value)
      } : {}, {
        f: !connecting.value && connectionPhase.value !== "open"
      }, !connecting.value && connectionPhase.value !== "open" ? {
        g: common_vendor.o(handleConnect, "e0")
      } : {}) : {}, {
        h: common_vendor.t(showDebug.value ? "收起" : "展开"),
        i: common_vendor.o(($event) => showDebug.value = !showDebug.value, "66"),
        j: showDebug.value
      }, showDebug.value ? common_vendor.e({
        k: common_vendor.o(clearDebugLogs, "9c"),
        l: !socketJoined.value,
        m: common_vendor.o(sendPingState, "6d"),
        n: common_vendor.f(debugLogs.value, (row, i, i0) => {
          return {
            a: common_vendor.t(row.time),
            b: common_vendor.t(row.tag),
            c: common_vendor.t(row.msg),
            d: i,
            e: common_vendor.n("log-" + row.level)
          };
        }),
        o: !debugLogs.value.length
      }, !debugLogs.value.length ? {} : {}, {
        p: logScrollTop.value
      }) : {}, {
        q: socketJoined.value
      }, socketJoined.value ? {
        r: common_vendor.t(planTitle.value),
        s: common_vendor.t(planCount.value),
        t: common_vendor.t(loadingPlan.value ? "加载中…" : "重新下发计划"),
        v: loadingPlan.value,
        w: common_vendor.o(pushSetPlan, "cb")
      } : {}, {
        x: socketJoined.value && planIds.value.length
      }, socketJoined.value && planIds.value.length ? {
        y: common_vendor.o(($event) => sendCmd("resume"), "b3"),
        z: common_vendor.o(($event) => sendCmd("pause"), "6c"),
        A: common_vendor.o(($event) => sendCmd("resetBlockTimer"), "80"),
        B: currentIndex.value <= 0,
        C: common_vendor.o(($event) => shiftItem(-1), "c6"),
        D: currentIndex.value >= planIds.value.length - 1,
        E: common_vendor.o(($event) => shiftItem(1), "4d"),
        F: common_vendor.o(toggleVideo, "11"),
        G: common_vendor.o(endTraining, "10")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b984102b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/screen-control/screen-control.js.map
