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

脚本会将 `release/wxgame`（或 `release/weixinminigame`）下的内容复制到主工程 `openDataContext/` 目录。

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
  module/UISocialInviteView.ts   # 预制体驱动的邀请列表 UI
  opendata/
    OpenDataApp.ts             # 开放域应用入口
    InviteOpenDataModule.ts    # 消息处理 / 好友数据 / 分享
    WxOpenDataBridge.ts        # wx.onMessage 桥接
    OpenDataAssets.ts          # UI 资源 UUID（构建时打入包内）
    OpenDataCommand.ts         # 与主域约定的消息类型
```

## 注意事项

- 开放域是独立 JS 作用域，**必须在本工程内单独构建 UI 资源**，不能依赖主域分包
- 修改 UI 后需重新构建并执行部署脚本
- 真机测试需配置微信小程序「微信朋友关系」隐私指引
