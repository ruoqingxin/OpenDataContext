#!/usr/bin/env node
"use strict";

/**
 * 根据 Laya prefab (.lh) 同步开放域 render 目录下的 style.js / assets.js / tplfn.js
 *
 * 用法：
 *   node scripts/sync-prefab-layout.js
 *   node scripts/sync-prefab-layout.js --prefab assets/prefab/UISocialInviteView.lh --out-dir scripts/openDataContext/views/inviteFriend/render
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

const MARK_START = "// @prefab-sync-start";
const MARK_END = "// @prefab-sync-end";

function getArg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
}

const prefabPath = getArg(
  "--prefab",
  path.join(projectRoot, "assets/prefab/UISocialInviteView.lh")
);
const renderDir = getArg(
  "--out-dir",
  path.join(
    projectRoot,
    "scripts/openDataContext/views/inviteFriend/render"
  )
);
const imageDir = path.join(projectRoot, "assets/image");

// --- prefab parse helpers ---

function num(v, fallback) {
  return v == null ? fallback : Number(v);
}

function parseResUuid(src) {
  if (!src || typeof src !== "string") {
    return null;
  }
  const m = src.match(/^res:\/\/([0-9a-f-]+)$/i);
  return m ? m[1] : null;
}

function buildUuidIndex(dir) {
  const map = new Map();
  if (!fs.existsSync(dir)) {
    return map;
  }
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".meta")) {
      continue;
    }
    try {
      const meta = JSON.parse(
        fs.readFileSync(path.join(dir, file), "utf8")
      );
      if (meta.uuid) {
        map.set(meta.uuid, file.replace(/\.meta$/, ""));
      }
    } catch (_err) {
      // skip invalid meta
    }
  }
  return map;
}

function findList(root) {
  function walk(node) {
    if (node._$type === "GList") {
      return node;
    }
    for (const child of node._$child || []) {
      const found = walk(child);
      if (found) {
        return found;
      }
    }
    return null;
  }
  return walk(root);
}

function findItemTemplate(listNode) {
  const ref = listNode._templateNode && listNode._templateNode._$ref;
  if (ref) {
    const item = (listNode._$child || []).find((c) => c._$id === ref);
    if (item) {
      return item;
    }
  }
  return (listNode._$child || []).find((c) => c.name === "item") || null;
}

function absBox(node) {
  return {
    position: "absolute",
    left: num(node.x, 0),
    top: num(node.y, 0),
    width: num(node.width),
    height: num(node.height),
  };
}

function textBox(node) {
  const style = absBox(node);
  style.fontSize = num(node.fontSize, 26);
  style.color = node.color || "#ffffff";
  style.verticalAlign = node.valign === "top" ? "top" : "middle";
  if (node.align === "center") {
    style.textAlign = "center";
  }
  if (node.overflow === "ellipsis") {
    style.textOverflow = "ellipsis";
  }
  if (node.stroke != null) {
    style.textStrokeWidth = num(node.stroke);
  }
  if (node.strokeColor) {
    style.textStrokeColor = node.strokeColor;
    if (style.textStrokeWidth == null) {
      style.textStrokeWidth = 1;
    }
  }
  return style;
}

function flattenItemNodes(itemNode) {
  const result = [];

  function addNode(node) {
    const name = node.name;
    if (!name) {
      return;
    }

    if (node._$type === "GTextField") {
      result.push({ name, style: textBox(node) });
      return;
    }

    if (
      node._$type === "GImage" ||
      node._$type === "GLoader" ||
      node.src
    ) {
      result.push({ name, style: absBox(node) });
      return;
    }

    for (const child of node._$child || []) {
      addNode(child);
    }
  }

  for (const child of itemNode._$child || []) {
    addNode(child);
  }

  const btn = (itemNode._$child || []).find((c) => c.name === "btn_invite");
  if (btn) {
    const txt = (btn._$child || []).find((c) => c.name === "txt_title");
    if (txt) {
      const merged = textBox(txt);
      merged.left = num(btn.x, 0) + num(txt.x, 0);
      merged.top = num(btn.y, 0) + num(txt.y, 0);
      const idx = result.findIndex((r) => r.name === "txt_title");
      if (idx >= 0) {
        result[idx].style = merged;
      } else {
        result.push({ name: "txt_title", style: merged });
      }
    }
  }

  return result;
}

/** 按 prefab 子节点顺序收集列表项模板元素（用于 tplfn） */
function collectItemElements(itemNode) {
  const elements = [];

  function visit(node, parentBtn) {
    const name = node.name;
    if (!name) {
      for (const child of node._$child || []) {
        visit(child, parentBtn);
      }
      return;
    }

    if (node._$type === "GTextField") {
      const inBtn = Boolean(parentBtn);
      let binding = "static";
      if (name === "txt_nick") {
        binding = "nickname";
      } else if (inBtn && name === "txt_title") {
        binding = "btnLabel";
      }
      elements.push({
        name,
        tag: "text",
        binding,
        staticText: node.text || "",
        interactive: binding === "btnLabel",
      });
      return;
    }

    if (
      node._$type === "GImage" ||
      node._$type === "GLoader" ||
      node.src
    ) {
      const isHead = name === "img_head";
      const isBtn =
        name === "btn_invite" || /^btn_/.test(name);
      let binding = "static";
      if (isHead) {
        binding = "avatar";
      } else if (isBtn) {
        binding = "btn";
      }
      elements.push({
        name,
        tag: "image",
        binding,
        uuid: parseResUuid(node.src),
        interactive: isBtn,
      });
      const nextParent = isBtn ? node : parentBtn;
      for (const child of node._$child || []) {
        visit(child, nextParent);
      }
      return;
    }

    for (const child of node._$child || []) {
      visit(child, parentBtn);
    }
  }

  for (const child of itemNode._$child || []) {
    visit(child, null);
  }

  return elements;
}

function imageVarName(nodeName, binding) {
  if (binding === "avatar") {
    return "avatarFallback";
  }
  if (binding === "btn") {
    return "btnImg";
  }
  const base = nodeName.replace(/^img_/, "");
  return base + "Img";
}

function convertStyles(prefab) {
  const root = prefab;
  const list = findList(root);
  if (!list) {
    throw new Error("prefab 中未找到 GList");
  }

  const item = findItemTemplate(list);
  if (!item) {
    throw new Error("GList 未找到 item 模板");
  }

  const rootW = num(root.width, num(list.width, 350));
  const rootH = num(root.height, num(list.height, 601));
  const listW = num(list.width, rootW);
  const listH = num(list.height, rootH);
  const listX = num(list.x, 0);
  const listY = num(list.y, 0);

  const styles = {
    container: {
      width: rootW,
      height: rootH,
      position: "relative",
    },
    list_items: {
      position: "absolute",
      left: listX,
      top: listY,
      width: listW,
      height: listH,
      flexDirection: "column",
      scrollY: true,
    },
    item: {
      width: num(item.width, listW),
      height: num(item.height, 122),
      position: "relative",
      flexShrink: 0,
    },
    emptyText: {
      position: "absolute",
      left: listX,
      top: listY,
      width: listW,
      height: listH,
      fontSize: 24,
      color: "#999999",
      textAlign: "center",
      verticalAlign: "middle",
    },
  };

  for (const { name, style } of flattenItemNodes(item)) {
    styles[name] = style;
  }

  return { styles, list, item };
}

function resolveStaticAssets(itemElements, uuidIndex) {
  const files = [];
  const seen = new Set();

  for (const el of itemElements) {
    if (!el.uuid) {
      continue;
    }
    const file = uuidIndex.get(el.uuid);
    if (!file || seen.has(file)) {
      continue;
    }
    seen.add(file);
    files.push(file);
  }

  files.sort();
  return files;
}

// --- code generation ---

function formatObject(obj, indent) {
  const pad = "  ".repeat(indent);
  const lines = ["{"];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (typeof value === "string") {
      lines.push(`${pad}  ${key}: ${JSON.stringify(value)},`);
    } else {
      lines.push(`${pad}  ${key}: ${value},`);
    }
  }
  lines.push(`${pad}}`);
  return lines.join("\n");
}

function buildStyleContent(styles, prefabRel) {
  const lines = [
    "/**",
    ` * Layout 样式 — 由 ${prefabRel} 转换`,
    " * 标记 @prefab-sync-start … @prefab-sync-end 区块供 sync-prefab-layout.js 覆盖，请勿手改。",
    " */",
    MARK_START,
    "module.exports = {",
  ];

  const order = [
    "container",
    "list_items",
    "item",
    "img_bg",
    "img_head",
    "txt_nick",
    "btn_invite",
    "txt_title",
    "emptyText",
  ];

  const keys = [
    ...order.filter((k) => styles[k]),
    ...Object.keys(styles).filter((k) => order.indexOf(k) < 0),
  ];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    lines.push(
      `  ${key}: ${formatObject(styles[key], 1)}${i < keys.length - 1 ? "," : ""}`
    );
  }

  lines.push("};", MARK_END, "");
  return lines.join("\n");
}

function buildAssetsContent(assetFiles) {
  const paths = assetFiles.map(
    (f) => `  "openDataContext/image/${f}",`
  );
  return [
    "// auto generated by sync-prefab-layout.js",
    MARK_START,
    "module.exports = [",
    ...paths,
    "];",
    MARK_END,
    "",
  ].join("\n");
}

function buildTplFnContent(itemElements, listName, uuidIndex) {
  const staticVars = [];
  const declared = new Set();

  for (const el of itemElements) {
    if (el.binding !== "static" && el.binding !== "btn" && el.binding !== "avatar") {
      continue;
    }
    const varName = imageVarName(el.name, el.binding);
    if (declared.has(varName)) {
      continue;
    }
    declared.add(varName);
    const file =
      (el.uuid && uuidIndex.get(el.uuid)) ||
      (el.binding === "avatar" ? "icon_800000.png" : null);
    if (!file) {
      continue;
    }
    staticVars.push({ varName, file });
  }

  const btnLabel =
    itemElements.find((e) => e.binding === "btnLabel") || {};
  const btnLabelText = btnLabel.staticText || "邀请";

  const varDeclLines = staticVars.map(
    ({ varName, file }) =>
      `  var ${varName} =\n    images[${JSON.stringify(file)}] || "openDataContext/image/${file}";`
  );

  function emitItemElement(el) {
    const lines = [];
    const cls = el.name;

    if (el.tag === "image") {
      if (el.binding === "avatar") {
        lines.push(
          `      out += '<image class="${cls}" src="' + avatar + '"></image>';`
        );
      } else if (el.interactive) {
        const v = imageVarName(el.name, el.binding);
        lines.push(
          `      out +=`,
          `        '<image id="btn_' +`,
          `        i +`,
          `        '" class="${cls}" src="' +`,
          `        escAttr(${v}) +`,
          `        '"></image>';`
        );
      } else {
        const v = imageVarName(el.name, el.binding);
        lines.push(
          `      out += '<image class="${cls}" src="' + escAttr(${v}) + '"></image>';`
        );
      }
      return lines;
    }

    if (el.tag === "text") {
      if (el.binding === "nickname") {
        lines.push(
          `      out += '<text class="${cls}" value="' + nickname + '"></text>';`
        );
      } else if (el.interactive) {
        lines.push(
          `      out +=`,
          `        '<text id="txt_' +`,
          `        i +`,
          `        '" class="${cls}" value="${btnLabelText.replace(/"/g, '\\"')}"></text>';`
        );
      } else if (el.staticText) {
        lines.push(
          `      out += '<text class="${cls}" value="${el.staticText.replace(/"/g, '\\"')}"></text>';`
        );
      }
    }

    return lines;
  }

  const itemBodyLines = [];
  for (const el of itemElements) {
    itemBodyLines.push(...emitItemElement(el));
  }

  const lines = [
    "// auto generated by sync-prefab-layout.js",
    "function escAttr(value) {",
    '  return String(value == null ? "" : value)',
    '    .replace(/&/g, "&amp;")',
    '    .replace(/"/g, "&quot;")',
    '    .replace(/</g, "&lt;")',
    '    .replace(/\'/g, "&#39;");',
    "}",
    "",
    "module.exports = function tplFn(it) {",
    "  it = it || {};",
    "  var data = Array.isArray(it.data) ? it.data : [];",
    "  var images = it.images || {};",
    '  var emptyText = it.emptyText || "暂无可邀请的微信好友";',
    ...varDeclLines,
    '  var out = \'<view id="container" class="container">\';',
    "",
    "  if (data.length === 0) {",
    "    out +=",
    '      \'<text class="emptyText" value="\' + escAttr(emptyText) + \'"></text>\';',
    "  } else {",
    `    out += '<scrollview id="${listName}" class="${listName}" scrollY="true">';`,
    "",
    "    for (var i = 0; i < data.length; i++) {",
    "      var row = data[i] || {};",
    "      var openid = escAttr(row.openid);",
    '      var nickname = escAttr(row.nickName || row.nickname || "微信好友");',
    "      var avatar = escAttr(row.avatarUrl || avatarFallback);",
    "",
    "      out +=",
    '        \'<view class="item" id="item_\' +',
    "        i +",
    '        \'" data-openid="\' +',
    "        openid +",
    '        \'">\';',
    "",
    ...itemBodyLines,
    "",
    '      out += "</view>";',
    "    }",
    "",
    "    out += \"</scrollview>\";",
    "  }",
    "",
    "  out += \"</view>\";",
    "  return out;",
    "};",
    "",
  ];

  return [MARK_START, lines.join("\n"), MARK_END, ""].join("\n");
}

function writeGeneratedFile(filePath, fullContent) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    const old = fs.readFileSync(filePath, "utf8");
    const re = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
    if (re.test(old)) {
      const start = fullContent.indexOf(MARK_START);
      const end = fullContent.indexOf(MARK_END) + MARK_END.length;
      if (start >= 0 && end > start) {
        const block = fullContent.slice(start, end);
        const head = fullContent.slice(0, start);
        fs.writeFileSync(filePath, head + block + "\n", "utf8");
        return;
      }
    }
  }

  fs.writeFileSync(filePath, fullContent, "utf8");
}

function syncFromPrefab(prefabPath, renderDir, imageDir) {
  const outStyle = path.join(renderDir, "style.js");
  const outAssets = path.join(renderDir, "assets.js");
  const outTplfn = path.join(renderDir, "tplfn.js");
  if (!fs.existsSync(prefabPath)) {
    throw new Error("找不到 prefab: " + prefabPath);
  }

  const prefab = JSON.parse(fs.readFileSync(prefabPath, "utf8"));
  const uuidIndex = buildUuidIndex(imageDir);
  const prefabRel = path
    .relative(projectRoot, prefabPath)
    .replace(/\\/g, "/");

  const { styles, list } = convertStyles(prefab);
  const itemElements = collectItemElements(findItemTemplate(list));
  const assetFiles = resolveStaticAssets(itemElements, uuidIndex);
  const listName = list.name || "list_items";

  const styleContent = buildStyleContent(styles, prefabRel);
  const assetsContent = buildAssetsContent(assetFiles);
  const tplfnContent = buildTplFnContent(
    itemElements,
    listName,
    uuidIndex
  );

  writeGeneratedFile(outStyle, styleContent);
  writeGeneratedFile(outAssets, assetsContent);
  writeGeneratedFile(outTplfn, tplfnContent);

  return {
    prefabRel,
    styleKeys: Object.keys(styles),
    assetFiles,
    itemElements: itemElements.map((e) => e.name),
    outputs: [outStyle, outAssets, outTplfn],
  };
}

try {
  const result = syncFromPrefab(prefabPath, renderDir, imageDir);
  console.log("[sync-prefab-layout] 已同步 render 目录:", renderDir);
  console.log("  prefab:", prefabPath);
  console.log("  style 节点:", result.styleKeys.join(", "));
  console.log("  图片资源:", result.assetFiles.join(", ") || "(无)");
  console.log("  列表项节点:", result.itemElements.join(", "));
  for (const f of result.outputs) {
    console.log("   ", f);
  }
} catch (err) {
  console.error("[sync-prefab-layout]", err.message || err);
  process.exit(1);
}
