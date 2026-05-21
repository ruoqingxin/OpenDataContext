# 开放域导出说明

本工程 `WxOpenDataContext` 是主工程 `xiqiwx_s` 的微信开放数据域子项目，UI 使用与主域一致的预制体 `prefab/UISocialInviteView.lh`（同款切图：`ui_frame_qswj_d`、`ui_btn_ty_g2`、`icon_800000`）。

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

脚本会将 `release/wxgame`（或 `release/weixinminigame`）下的内容复制到主工程 `openDataContext/` 目录，并自动生成开放域入口 `index.js`。

### 开放域入口说明

Laya IDE 构建产物默认入口是 `game.js`（完整主域启动链），**微信开放域子域**实际加载的是根目录 `index.js`，需手动/脚本生成：

```javascript
require("weapp-adapter.js");
window.loadLib = require;
loadLib("libs/laya.core.js");
// ... 引擎 libs ...
Laya.isWXOpenDataContext = true;
Laya.isWXPosMsg = true;
loadLib("js/bundle.js");   // 业务代码
loadLib("js/index.js");    // Laya.init + 打开 Scene.ls
```

模板文件：`scripts/openDataContext-index.js`。仅构建、不部署时可执行：

```powershell
.\WxOpenDataContext\scripts\patch-release-entry.ps1
```

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
  Main.ts                    # 入口，预加载 UI 资源并启动 OpenDataApp
  Main.generated.ts          # IDE 自动生成，勿手动修改
  module/UISocialInviteView.ts   # 预制体驱动的邀请列表 UI
  opendata/
    OpenDataApp.ts             # 开放域应用入口
    InviteOpenDataModule.ts    # 消息处理 / 好友数据 / 分享
    WxOpenDataBridge.ts        # wx.onMessage 桥接
    OpenDataAssets.ts          # UI 资源 UUID（构建时打入包内）
    OpenDataCommand.ts         # 与主域约定的消息类型
    types.ts                   # 共享类型定义
```

> 仅维护 `.ts` 源码；`src/` 下的 `.js` 为 IDE 编译产物，已加入 `.gitignore`。

## 注意事项

- 开放域是独立 JS 作用域，**必须在本工程内单独构建 UI 资源**，不能依赖主域分包
- 修改 UI 后需重新构建并执行部署脚本
- 真机测试需配置微信小程序「微信朋友关系」隐私指引
