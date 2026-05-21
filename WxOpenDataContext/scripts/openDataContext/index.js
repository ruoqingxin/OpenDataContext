require("./weapp-adapter.js");

const style = require("./render/style.js");
const tplFn = require("./render/tplfn.js");
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
    wx.getFriendCloudStorage({
        keyList: ["invite_tag"],
        success: function (res) {
            users = mapFriends(Array.isArray(res && res.data) ? res.data : []);
            loadedFriends = true;
            if (typeof done === "function") {
                done();
            }
        },
        complete: function () {
            loadingFriends = false;
        },
    });
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
    const template = tplFn({ data: users });
    Layout.clear();
    Layout.init(template, style);
    Layout.layout(sharedContext);
    bindInviteEvents();
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
    draw();
}

function hideInvite() {
    visible = false;
    Layout.clear();
    Layout.layout(sharedContext);
}

function init() {
    wx.onMessage(function (data) {
        if (!data || typeof data.type !== "string") {
            return;
        }
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
