# 开放域导出说明

轻量 canvas 方案：`laya.opendata.js` + 代码绘制 UI。视觉以 IDE 中 prefab 为设计源，运行时不加载 `.lh`。

## 改 UI 的流程

```
1. IDE 编辑 assets/prefab/UISocialInviteView.lh
        ↓
2. sync-prefab-layout.ps1   ← 自动同步布局常量到 TS
        ↓
3. Laya IDE 构建（微信小游戏）
        ↓
4. deploy-to-main.ps1
        ↓
5. openDataContext/ 部署到主工程
```

### 命令

```powershell
# 改完 prefab 后执行
node .\WxOpenDataContext\scripts\sync-prefab-layout.js
# 或
.\WxOpenDataContext\scripts\sync-prefab-layout.ps1

# IDE 构建完成后
.\WxOpenDataContext\scripts\deploy-to-main.ps1
```

`sync-prefab-layout.ps1` 会更新：

| 自动生成区域 | 文件 |
|-------------|------|
| `LIST`、`ITEM_*` 布局常量 | `src/opendata/UISocialInviteView.ts` |
| 切图路径 `OPEN_DATA_IMAGES` | `src/opendata/OpenDataAssets.ts` |

标记为 `// @prefab-sync-start` … `// @prefab-sync-end` 的区块请勿手改。

若 prefab/TS 比 `release/.../bundle.js` 新，deploy 会报错提示先重新构建。

## 运行时加载链

```
index.js → laya.opendata.js → bundle.js
                ↓
         image/*.png（切图，不含 .lh）
```

## 源码结构

```
src/
  Main.ts
  opendata/
    InviteOpenDataModule.ts
    UISocialInviteView.ts      # 按 prefab 常量 canvas 绘制
    OpenDataAssets.ts          # prefab 切图路径
    types.ts
assets/
  prefab/UISocialInviteView.lh # 设计源（仅 IDE 用）
  image/*.png
```

## 主域消息协议

| type | 说明 |
|------|------|
| `od:showInviteFriend` | 显示邀请列表 |
| `od:hideInviteFriend` | 隐藏列表 |
| `updateViewPort` | 视口同步 |
| `close` | 关闭 |

## 注意事项

- 开放域是独立 JS 作用域，不能依赖主域分包
- 真机测试需配置「微信朋友关系」隐私指引
