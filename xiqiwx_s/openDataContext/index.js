require("./weapp-adapter.js");

const createStyle = require("./render/style.js");
const tplFn = require("./render/tplfn.js");
const localImages = require("./render/assets.js");
const Layout = require("./engine.js").default;

const sharedCanvas = wx.getSharedCanvas();
const sharedContext = sharedCanvas.getContext("2d");

const OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend",
    UpdateViewPort: "updateViewPort",
    Close: "close",
};

let shareConfig = {
    roomId: 0,
    roomName: "",
    shareTxt: "",
    shareImageUrl: "",
    shareImageUrlId: "",
};

let users = [];
let visible = false;
let loadingFriends = false;
let loadedFriends = false;

let imagesReady = false;
let imagesLoading = false;
let imageLoadQueue = [];

let currentViewPort = null;

/**
 * 日志统一输出
 */
function logOpenData(tag, data) {
    try {
        console.log("[OpenData][" + tag + "] " + JSON.stringify(data));
    } catch (err) {
        console.log("[OpenData][" + tag + "]", data);
    }
}

/**
 * sharedCanvas 在不同环境下的本地资源路径兼容
 */
function resolveLocalImage(storedPath) {
    if (!storedPath || /^https?:\/\//i.test(storedPath)) {
        return storedPath;
    }

    const normalized = storedPath.replace(/^\.\//, "");
    const shortPath =
        normalized.indexOf("openDataContext/") === 0
            ? normalized.slice("openDataContext/".length)
            : normalized;

    const gameRootPath =
        normalized.indexOf("openDataContext/") === 0
            ? normalized
            : "openDataContext/" + normalized;

    const candidates = [
        shortPath,
        "./" + shortPath,
        gameRootPath,
        "./" + gameRootPath,
    ];

    const tried = [];

    if (typeof wx !== "undefined" && wx.getFileSystemManager) {
        const fs = wx.getFileSystemManager();

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            if (tried.indexOf(candidate) >= 0) {
                continue;
            }

            tried.push(candidate);

            try {
                fs.accessSync(candidate);
                return gameRootPath;
            } catch (err) {
                // try next
            }
        }

        console.warn(
            "[OpenData] image not found, expected under openDataContext/image/:",
            gameRootPath,
            "tried:",
            tried.join(", ")
        );
    }

    return gameRootPath;
}

/**
 * 预加载开放域资源图
 */
function ensureImagesLoaded(callback) {
    if (imagesReady) {
        callback();
        return;
    }

    imageLoadQueue.push(callback);

    if (imagesLoading) {
        return;
    }

    imagesLoading = true;

    const sources = localImages.map(resolveLocalImage);

    const finish = function () {
        imagesReady = true;
        imagesLoading = false;

        const queue = imageLoadQueue.slice();
        imageLoadQueue.length = 0;

        for (let i = 0; i < queue.length; i++) {
            queue[i]();
        }
    };

    if (typeof Layout.loadImgs === "function") {
        Layout.loadImgs(sources)
            .then(finish)
            .catch(function (err) {
                console.error("[OpenData] Layout.loadImgs failed:", err);
                imagesLoading = false;
                imageLoadQueue.length = 0;
            });
        return;
    }

    finish();
}

/**
 * 过滤和整理微信好友数据
 */
function mapFriends(list) {
    const result = [];
    const seen = new Set();

    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const openid = typeof item.openid === "string" ? item.openid.trim() : "";

        if (!openid || seen.has(openid)) {
            continue;
        }

        seen.add(openid);

        const name = item.nickName || item.nickname;

        result.push({
            openid: openid,
            nickName: typeof name === "string" && name.trim() ? name : "微信好友",
            avatarUrl: typeof item.avatarUrl === "string" ? item.avatarUrl : "",
        });
    }

    return result;
}

/**
 * 拉取微信好友列表
 */
function loadFriends(done) {
    if (loadingFriends || loadedFriends) {
        if (typeof done === "function") {
            done();
        }
        return;
    }

    loadingFriends = true;

    let cloudFriends = [];
    let potentialFriends = [];
    let pending = 0;
    let settled = false;

    function finishSource() {
        pending--;

        if (pending > 0 || settled) {
            return;
        }

        settled = true;
        users = mapFriends(cloudFriends.concat(potentialFriends));
        loadedFriends = true;
        loadingFriends = false;

        logOpenData("friends.loaded", {
            cloudCount: cloudFriends.length,
            potentialCount: potentialFriends.length,
            finalCount: users.length,
        });

        if (typeof done === "function") {
            done();
        }
    }

    function startSource() {
        pending++;
    }

    startSource();
    wx.getFriendCloudStorage({
        keyList: ["kv_data"],
        success: function (res) {
            cloudFriends = Array.isArray(res && res.data) ? res.data : [];
        },
        fail: function (err) {
            console.error("[OpenData] getFriendCloudStorage failed:", err);
        },
        complete: finishSource,
    });

    if (typeof wx.getPotentialFriendList === "function") {
        startSource();
        wx.getPotentialFriendList({
            success: function (res) {
                potentialFriends = Array.isArray(res && res.list) ? res.list : [];
            },
            fail: function (err) {
                console.error("[OpenData] getPotentialFriendList failed:", err);
            },
            complete: finishSource,
        });
    }
}

/**
 * 发起分享邀请
 */
function shareToFriend(openid) {
    const query =
        "room_id=" + encodeURIComponent(String(shareConfig.roomId)) +
        "&room_name=" + encodeURIComponent(shareConfig.roomName) +
        "&invite_openid=" + encodeURIComponent(openid);

    const payload = {
        title: shareConfig.shareTxt,
        imageUrl: shareConfig.shareImageUrl,
        query: query,
    };

    logOpenData("shareToFriend", {
        openid: openid,
        roomId: shareConfig.roomId,
        roomName: shareConfig.roomName,
        shareTxt: shareConfig.shareTxt,
        shareImageUrl: shareConfig.shareImageUrl,
        shareImageUrlId: shareConfig.shareImageUrlId,
    });

    if (typeof wx.shareMessageToFriend === "function") {
        wx.shareMessageToFriend(
            Object.assign({}, payload, { openId: openid })
        );
    } else if (typeof wx.shareAppMessage === "function") {
        wx.shareAppMessage(
            Object.assign({}, payload, { imageUrlId: shareConfig.shareImageUrlId })
        );
    }
}

/**
 * 绑定按钮点击
 */
function bindInviteEvents() {
    for (let i = 0; i < users.length; i++) {
        (function (index) {
            const user = users[index];
            const elements = Layout.getElementsById("btn_" + index);
            const btn = elements && elements[0];

            if (!btn || !user) {
                return;
            }

            btn.on("click", function () {
                logOpenData("btn.click", {
                    index: index,
                    openid: user.openid,
                    nickName: user.nickName,
                });
                shareToFriend(user.openid);
            });
        })(i);
    }
}

/**
 * 当前布局使用的逻辑高度
 *
 * 这里非常关键：
 * - 如果主域已经传了 updateViewPort(box)
 * - 那么布局高度必须跟随 box.height
 * - 这样 scroll 区域 / 视觉区域 / 命中区域才统一
 */
function getLayoutHeight() {
  return sharedCanvas.height || 1280;
}

/**
 * 当前布局使用的逻辑宽度
 *
 * 当前方案下逻辑宽度固定 720，不让 item 内部布局变化
 */
function getLayoutWidth() {
    return 720;
}

/**
 * 当前 viewport 是否有效
 */
function hasValidViewPort() {
    return !!(
        currentViewPort &&
        Number(currentViewPort.width) > 0 &&
        Number(currentViewPort.height) > 0
    );
}

/**
 * 打印布局调试结果
 */
function printLayoutDebug() {
    try {
        const list = Layout.getElementsById("list")[0];
        const btn0 = Layout.getElementsById("btn_0")[0];
        const btn1 = Layout.getElementsById("btn_1")[0];
        const item0 = Layout.getElementsByClassName("item")[0];
        const container = Layout.getElementsById("container")[0];
        const emptyText = Layout.getElementsById("emptyText")[0];

        const result = {
            viewport: Layout.viewport,
            renderport: Layout.renderport,
            viewportScaleX: Layout.viewportScaleX,
            viewportScaleY: Layout.viewportScaleY,
            realLayoutBox: Layout.realLayoutBox,
        };

        if (container) {
            result.containerLayoutBox = container.layoutBox;
            result.containerViewportRect = Layout.getElementViewportRect(container);
        }

        if (list) {
            result.listLayoutBox = list.layoutBox;
            result.listViewportRect = Layout.getElementViewportRect(list);
            result.listScrollHeight = list.scrollHeight;
            result.listScrollWidth = list.scrollWidth;
        }

        if (emptyText) {
            result.emptyTextLayoutBox = emptyText.layoutBox;
            result.emptyTextViewportRect = Layout.getElementViewportRect(emptyText);
        }

        if (item0) {
            result.item0LayoutBox = item0.layoutBox;
            result.item0ViewportRect = Layout.getElementViewportRect(item0);
        }

        if (btn0) {
            result.btn0LayoutBox = btn0.layoutBox;
            result.btn0ViewportRect = Layout.getElementViewportRect(btn0);
        }

        if (btn1) {
            result.btn1LayoutBox = btn1.layoutBox;
            result.btn1ViewportRect = Layout.getElementViewportRect(btn1);
        }

        logOpenData("draw.result", result);
    } catch (err) {
        console.error("[OpenData][draw.result.error]", err);
    }
}

/**
 * 正式绘制
 */
function draw() {
    if (!visible) {
        logOpenData("draw.skip", { reason: "not visible" });
        return;
    }

    if (!hasValidViewPort()) {
        logOpenData("draw.skip", {
            reason: "invalid viewport",
            currentViewPort: currentViewPort,
            sharedCanvas: {
                width: sharedCanvas.width,
                height: sharedCanvas.height,
            },
        });
        return;
    }

    ensureImagesLoaded(function () {
        const template = tplFn({ data: users });

        const style = createStyle({
            viewPort: currentViewPort, // 主域传来的真实列表显示窗口
            canvasWidth: getLayoutWidth(),
            canvasHeight: getLayoutHeight(),
            dataLength: users.length,
        });

        logOpenData("draw.input", {
            visible: visible,
            userCount: users.length,
            currentViewPort: currentViewPort,
            sharedCanvas: {
                width: sharedCanvas.width,
                height: sharedCanvas.height,
            },
            layoutWidth: getLayoutWidth(),
            layoutHeight: getLayoutHeight(),
            style_container: style.container,
            style_list: style.list,
            style_emptyText: style.emptyText,
            style_item: style.item,
            style_itemBtn: style.itemBtn,
        });

        Layout.clear();
        Layout.init(template, style);
        Layout.layout(sharedContext);

        printLayoutDebug();
        bindInviteEvents();
    });
}

/**
 * 展示邀请面板
 */
function showInvite(message) {
    shareConfig = {
        roomId: Number(message.room_id) || 0,
        roomName: String(message.room_name || ""),
        shareTxt: String(message.share_txt || ""),
        shareImageUrl: String(message.share_image_url || ""),
        shareImageUrlId: String(message.share_image_url_id || ""),
    };

    visible = true;

    logOpenData("showInvite", {
        shareConfig: shareConfig,
        currentViewPort: currentViewPort,
    });

    loadFriends(draw);
}

/**
 * 隐藏邀请面板
 */
function hideInvite() {
    visible = false;
    Layout.clear();

    logOpenData("hideInvite", {
        currentViewPort: currentViewPort,
    });
}

/**
 * 主消息入口
 */
function init() {
    wx.onMessage(function (data) {
        if (!data || typeof data.type !== "string") {
            return;
        }

        switch (data.type) {
            case OpenDataCommand.UpdateViewPort:
                if (data.box) {
                    currentViewPort = {
                        x: Number(data.box.x) || 0,
                        y: Number(data.box.y) || 0,
                        width: Number(data.box.width) || 0,
                        height: Number(data.box.height) || 0,
                    };

                    logOpenData("updateViewPort.recv", {
                        box: currentViewPort,
                        sharedCanvas: {
                            width: sharedCanvas.width,
                            height: sharedCanvas.height,
                        },
                    });

                    Layout.updateViewPort(currentViewPort);
                }

                if (visible) {
                    draw();
                }
                break;

            case OpenDataCommand.ShowInviteFriend:
                showInvite(data);
                break;

            case OpenDataCommand.HideInviteFriend:
            case OpenDataCommand.Close:
                hideInvite();
                break;

            default:
                logOpenData("message.unknown", data);
                break;
        }
    });
}

init();