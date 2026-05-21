# 开放域导出说明

标准 Layout 方案：`engine.js`（minigame-canvas-engine）+ `template/style` + `index.js`。  
视觉以 IDE 中 prefab 为设计源，由 sync 脚本生成 Layout 渲染文件。

## 改 UI 的流程

```
1. IDE 编辑 assets/prefab/UISocialInviteView.lh
        ↓
2. sync-prefab-layout.ps1   ← 同步 prefab → Layout style/tplfn
        ↓
3. deploy-to-main.ps1       ← 无需 Laya IDE 构建
        ↓
4. openDataContext/ 部署到主工程
```

### 命令

```powershell
# 改完 prefab 后执行
node .\WxOpenDataContext\scripts\sync-prefab-layout.js
# 或
.\WxOpenDataContext\scripts\sync-prefab-layout.ps1

# 首次或升级 Layout 引擎
npm install minigame-canvas-engine --prefix .\WxOpenDataContext\scripts

# 部署到主工程 openDataContext/
.\WxOpenDataContext\scripts\deploy-to-main.ps1
```

`sync-prefab-layout.ps1` 会更新：

| 自动生成区域 | 文件 |
|-------------|------|
| Layout 样式 | `scripts/openDataContext/render/style.js` |
| 模板函数 | `scripts/openDataContext/render/tplfn.js` |

标记为 `// @prefab-sync-start` … `// @prefab-sync-end` 的区块请勿手改。

若 prefab 比 `render/style.js` 新，deploy 会报错提示先 sync。

## 运行时加载链（LayaAir 标准流程）

```
index.js
  → render/style.js + render/tplfn.js
  → engine.js (Layout)
  → wx.getSharedCanvas() 绘制
  → image/*.png
```

对应文档中的四步渲染：

1. `Layout.updateViewPort(box)` — 主域 `OpenDataContextView` 自动发送
2. `Layout.clear()`
3. `Layout.init(template, style)`
4. `Layout.layout(sharedContext)`

## 源码结构

```
scripts/
  openDataContext/
    index.js                 # wx.onMessage + getFriendCloudStorage + Layout 渲染
    render/
      style.js               # prefab 同步的 Layout 样式
      tplfn.js               # prefab 同步的模板函数
  libs/engine.js             # minigame-canvas-engine（deploy 时复制）
assets/
  prefab/UISocialInviteView.lh  # 设计源（仅 IDE 用）
  image/*.png
src/
  Main.ts                    # IDE 占位脚本，开放域不依赖 bundle
```

## 主域消息协议

| type | 说明 |
|------|------|
| `od:showInviteFriend` | 显示邀请列表 |
| `od:hideInviteFriend` | 隐藏列表 |
| `updateViewPort` | 视口同步 |
| `close` | 关闭 |

## 注意事项

- 开放域是独立 JS 作用域，不能依赖主域分包或 Laya bundle
- 真机测试需配置「微信朋友关系」隐私指引
- 主域需在场景中使用 `OpenDataContextView` 并通过 `wx.getOpenDataContext().postMessage()` 通信
