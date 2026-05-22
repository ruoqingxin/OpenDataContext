require("./weapp-adapter.js");

const style = require("./render/style.js");
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

    const candidates = [shortPath, "./" + shortPath, gameRootPath, "./" + gameRootPath];
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
                // try next candidate
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
        if (typeof done === "function") {
            done();
        }
    }

    function startSource() {
        pending++;
    }

    startSource();

    console.error("wx.getFriendCloudStorage");

    wx.getFriendCloudStorage({
        keyList: ["kv_data"],
        success: function (res) {
            cloudFriends = Array.isArray(res && res.data) ? res.data : [];
        },
        complete: finishSource,
    });

    if (typeof wx.getPotentialFriendList === "function") {
        startSource();
        wx.getPotentialFriendList({
            success: function (res) {
                potentialFriends = Array.isArray(res && res.list) ? res.list : [];
            },
            complete: finishSource,
        });
    }
}

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
    if (typeof wx.shareMessageToFriend === "function") {
        wx.shareMessageToFriend(Object.assign({}, payload, { openId: openid }));
    } else if (typeof wx.shareAppMessage === "function") {
        wx.shareAppMessage(Object.assign({}, payload, { imageUrlId: shareConfig.shareImageUrlId }));
    }
}

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
                shareToFriend(user.openid);
            });
        })(i);
    }
}

function draw() {
    if (!visible) {
        return;
    }
    ensureImagesLoaded(function () {
        const template = tplFn({ data: users });
        Layout.clear();
        Layout.init(template, style);
        Layout.layout(sharedContext);
        bindInviteEvents();
    });
}

function showInvite(message) {
    shareConfig = {
        roomId: Number(message.room_id) || 0,
        roomName: String(message.room_name || ""),
        shareTxt: String(message.share_txt || ""),
        shareImageUrl: String(message.share_image_url || ""),
        shareImageUrlId: String(message.share_image_url_id || ""),
    };
    visible = true;
    loadFriends(draw);
}

function hideInvite() {
    visible = false;
    Layout.clear();
}

function init() {
    wx.onMessage(function (data) {
        if (!data || typeof data.type !== "string") {
            return;
        }

        console.error("onMessage"+JSON.stringify(data))

        switch (data.type) {
            case OpenDataCommand.UpdateViewPort:
                if (data.box) {
                    Layout.updateViewPort(data.box);
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
                break;
        }
    });
}

init();
