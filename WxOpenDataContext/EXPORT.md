# 开放域导出说明

轻量 canvas 方案：`laya.opendata.js` + 代码绘制 UI，不依赖 UI2 预制体与完整引擎库。

## 流程

```
Laya IDE 构建 (WxOpenDataContext)
        ↓
release/wxgame/js/bundle.js
        ↓
deploy-to-main.ps1
        ↓
openDataContext/  （仅 6 个文件）
        ↓
微信主域 game.json → "openDataContext": "openDataContext/"
        ↓
主域 postMsg → 开放域 wx.onMessage → 渲染好友列表
```

## 构建与部署

1. 打开 `WxOpenDataContext` → **构建发布** → **微信小游戏**
2. 执行：

```powershell
.\WxOpenDataContext\scripts\deploy-to-main.ps1
```

部署脚本会自动：写入轻量 `index.js`、替换 `laya.opendata.js`、删除 UI2 重型产物。

## 运行时加载链

```javascript
index.js
  → weapp-adapter.js
  → libs/laya.opendata.js
  → js/bundle.js          // Main.ts: Laya.init + wx.onMessage
```

## 源码结构

```
src/
  Main.ts                         # 入口：Laya.init + wx.onMessage
  opendata/
    InviteOpenDataModule.ts       # 消息 / 好友数据 / 分享
    UISocialInviteView.ts         # canvas 绘制邀请列表
    types.ts                      # 类型 + OpenDataCommand 常量
```

## 主域消息协议

| type | 说明 |
|------|------|
| `od:showInviteFriend` | 显示邀请列表（含 room_id、share_txt 等） |
| `od:hideInviteFriend` | 隐藏列表 |
| `updateViewPort` | 视口同步 |
| `close` | 关闭 |

## 注意事项

- 开放域是独立 JS 作用域，不能依赖主域分包
- 修改源码后需重新构建并部署
- 真机测试需配置「微信朋友关系」隐私指引
