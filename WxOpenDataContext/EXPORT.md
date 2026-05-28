# 开放域导出说明

标准 Layout 方案：`engine.js`（minigame-canvas-engine）+ `render/style.js` + `render/tplfn.js` + `render/assets.js`。

视觉以 IDE 中 prefab 为设计源，由 `sync-prefab-layout.js` 生成三个 render 文件。

---

## 调用方法

**所有命令均在 `WxOpenDataContext` 项目根目录下执行**（即包含 `assets/`、`scripts/` 的目录）。

### 1. 同步 prefab → render（改 UI 后必跑）

根据 `assets/prefab/UISocialInviteView.lh` 生成：

| 输出文件 |
|----------|
| `scripts/openDataContext/views/inviteFriend/render/style.js` |
| `scripts/openDataContext/views/inviteFriend/render/assets.js` |
| `scripts/openDataContext/views/inviteFriend/render/tplfn.js` |

**推荐（使用默认路径，无需参数）：**

```powershell
node scripts\sync-prefab-layout.js
```

**等价写法：**

```powershell
.\scripts\sync-prefab-layout.ps1
```

**自定义 prefab / 输出目录（一般不需要）：**

```powershell
node scripts\sync-prefab-layout.js `
  --prefab assets/prefab/UISocialInviteView.lh `
  --out-dir scripts/openDataContext/views/inviteFriend/render
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--prefab` | `assets/prefab/UISocialInviteView.lh` | Laya prefab 源文件 |
| `--out-dir` | `scripts/openDataContext/views/inviteFriend/render` | 生成的三个 JS 输出目录 |

成功时控制台会打印 prefab 路径、style 节点名、图片资源名及三个输出文件路径。

---

### 2. 部署到微信小游戏工程

将 `scripts/openDataContext` 与图片复制到主工程的 `openDataContext` 目录。

**默认部署路径：**

```powershell
.\scripts\deploy-to-wxprogrom.ps1
```

默认目标：`E:\BallOpenDataContext\WxProgrom\openDataContext`

**指定其它主工程目录：**

```powershell
.\scripts\deploy-to-wxprogrom.ps1 -TargetDir "E:\yourGame\openDataContext"
```

**从主工程 client 资源补图（本地 `assets/image` 没有 png 时）：**

```powershell
.\scripts\deploy-to-wxprogrom.ps1 -PoolClientAssets "F:\PoolBallNew\client2\assets"
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-TargetDir` | `E:\BallOpenDataContext\WxProgrom\openDataContext` | 微信小游戏内 `openDataContext` 目录 |
| `-PoolClientAssets` | `F:\PoolBallNew\client2\assets` | 主工程 assets，用于覆盖复制缺失的图片 |

部署前会检查：若 prefab 比 `style.js` 新，脚本会报错并提示先执行同步。

---

### 3. 完整工作流（日常）

```powershell
# 1. 在 Laya IDE 中编辑并保存
#    assets/prefab/UISocialInviteView.lh

# 2. 同步生成 render 三件套
node scripts\sync-prefab-layout.js

# 3. 部署到微信小游戏工程
.\scripts\deploy-to-wxprogrom.ps1
```

---

### 4. 其它

**首次或升级 Layout 引擎：**

```powershell
npm install minigame-canvas-engine --prefix scripts
```

**不要手改** `// @prefab-sync-start` … `// @prefab-sync-end` 之间的内容；改 prefab 后重新跑同步即可。

---

## 改 UI 流程示意

```
IDE 编辑 UISocialInviteView.lh
        ↓
node scripts\sync-prefab-layout.js
        ↓
.\scripts\deploy-to-wxprogrom.ps1
        ↓
微信开发者工具 / 真机验证
```

## 运行时加载链

```
views/inviteFriend/index.js
  → render/style.js + render/tplfn.js + render/assets.js
  → engine.js (Layout)
  → wx.getSharedCanvas() 绘制
  → openDataContext/image/*.png
```

## 源码结构

```
WxOpenDataContext/
  assets/
    prefab/UISocialInviteView.lh    # 设计源
    image/*.png                     # 开放域图片（含 .meta UUID）
  scripts/
    sync-prefab-layout.js           # prefab → render 同步
    sync-prefab-layout.ps1          # 同上（PowerShell 入口）
    deploy-to-wxprogrom.ps1         # 部署到主工程
    openDataContext/
      views/inviteFriend/
        index.js
        render/
          style.js
          tplfn.js
          assets.js
    libs/engine.js
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
