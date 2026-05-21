require("weapp-adapter.js");

window.loadLib = require;

loadLib("libs/laya.opendata.js");

// 必须在 Laya.init 之前设置
Laya.isWXOpenDataContext = true;
Laya.isWXPosMsg = true;

loadLib("js/bundle.js");
