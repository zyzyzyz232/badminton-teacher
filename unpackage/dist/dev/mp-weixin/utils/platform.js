"use strict";
const common_vendor = require("../common/vendor.js");
function isH5Client() {
  try {
    return common_vendor.index.getSystemInfoSync().uniPlatform === "web";
  } catch {
    return false;
  }
}
exports.isH5Client = isH5Client;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/platform.js.map
