# 开放域导出说明

本工程 `WxOpenDataContext` 是主工程的微信开放数据域子项目，采用 **轻量 canvas 方案**（`laya.opendata.js` + 代码绘制 UI），不依赖 UI2 预制体与完整引擎库。

## 在 Laya IDE 中构建

1. 打开 `WxOpenDataContext` 工程
2. **构建发布** → 平台选择 **微信小游戏**
3. 勾选 **生成开放数据域工程模板**（或「导出开放数据域」）
4. 输出目录建议：`WxOpenDataContext/release/wxgame`
5. 点击发布

## 部署到主工程

构建完成后，在项目根目录执行：

```powershell
.\WxOpenDataContext\scripts\deploy-to-main.ps1
```

脚本会将构建产物复制到主工程 `openDataContext/`，并自动：

- 生成轻量入口 `index.js`（仅加载 `laya.opendata.js` + `bundle.js`）
- 移除 `laya.core.js`、`laya.ui2.js`、`laya.webgl_2D.js` 等完整引擎库
- 移除 `internal/`、`prefab/`、`image/`、`Scene.ls`、`js/index.js` 等 UI2 产物

### 开放域入口说明

微信开放域子域实际加载的是根目录 `index.js`：

```javascript
require("weapp-adapter.js");
window.loadLib = require;
loadLib("libs/laya.opendata.js");
Laya.isWXOpenDataContext = true;
Laya.isWXPosMsg = true;
loadLib("js/bundle.js");   // 业务代码 + Laya.init 启动
```

模板文件：`scripts/openDataContext-index.js`。轻量引擎库模板：`scripts/libs/laya.opendata.js`。

## 主工程要求

主工程 `game.json` 需包含：

```json
"openDataContext": "openDataContext/"
```

主域 `UISocialInviteView` 通过 `OpenDataContextView.postMsg()` 发送：

| type | 说明 |
|------|------|
| `od:showInviteFriend` | 显示邀请列表 |
| `od:hideInviteFriend` | 隐藏列表 |
| `updateViewPort` | 视口同步（引擎自动发送） |
| `close` | 关闭（引擎自动发送） |

## 源码结构

```
src/
  Main.ts                    # 轻量入口：Laya.init + 启动 OpenDataApp
  module/UISocialInviteView.ts   # canvas 代码绘制的邀请列表 UI
  opendata/
    OpenDataApp.ts             # 开放域应用入口
    InviteOpenDataModule.ts    # 消息处理 / 好友数据 / 分享
    WxOpenDataBridge.ts        # wx.onMessage 桥接
    OpenDataCommand.ts         # 与主域约定的消息类型
    types.ts                   # 共享类型定义
```

> 仅维护 `.ts` 源码；`src/` 下的 `.js` 为 IDE 编译产物，已加入 `.gitignore`。

## 注意事项

- 开放域是独立 JS 作用域，不能依赖主域分包
- 修改 UI 后需重新构建并执行部署脚本
- 真机测试需配置微信小程序「微信朋友关系」隐私指引
