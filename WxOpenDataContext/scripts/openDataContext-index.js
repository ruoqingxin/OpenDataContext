require("weapp-adapter.js");

window.loadLib = require;

loadLib("libs/laya.core.js");
loadLib("libs/laya.webgl_2D.js");
loadLib("libs/laya.ui2.js");
loadLib("libs/laya.adapter-weixin.js");

// 开放域标记，须在 bundle 加载前设置
Laya.isWXOpenDataContext = true;
Laya.isWXPosMsg = true;

loadLib("js/bundle.js");
loadLib("js/index.js");
