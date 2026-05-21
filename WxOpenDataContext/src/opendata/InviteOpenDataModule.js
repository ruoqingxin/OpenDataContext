import UISocialInviteView from "../module/UISocialInviteView";
const OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend"
};
export default class InviteOpenDataModule {
    constructor(_stage, _bridge) {
        this._stage = _stage;
        this._bridge = _bridge;
        this._users = [];
        this._inviteView = null;
        this._isLoadingWxFriends = false;
        this._hasLoadedWxFriends = false;
        this._shareConfig = {
            roomId: 0,
            roomName: "",
            shareTxt: "",
            shareImageUrl: "",
            shareImageUrlId: ""
        };
    }
    handleMessage(message) {
        switch (message === null || message === void 0 ? void 0 : message.type) {
            case OpenDataCommand.ShowInviteFriend:
                this.handleShowMessage(message);
                break;
            case OpenDataCommand.HideInviteFriend:
                this.hideInviteView();
                break;
            default:
                break;
        }
    }
    onStageResize() {
        if (!this._inviteView) {
            return;
        }
        this._inviteView.size(this._stage.width, this._stage.height);
    }
    handleShowMessage(message) {
        this.applyShareConfig(message);
        this.loadFriendListFromWx();
        this.showInviteView();
    }
    showInviteView() {
        if (!this._inviteView) {
            this._inviteView = new UISocialInviteView(this.handleInviteUser.bind(this), this.handleViewClose.bind(this));
        }
        this.refreshInviteView();
        if (!this._inviteView.parent) {
            this._stage.addChild(this._inviteView);
        }
        this._inviteView.visible = true;
    }
    hideInviteView() {
        if (!this._inviteView) {
            return;
        }
        this._inviteView.onHide();
        this._inviteView.removeSelf();
    }
    refreshIfVisible() {
        if (!this._inviteView || !this._inviteView.parent) {
            return;
        }
        this.refreshInviteView();
    }
    handleInviteUser(openid) {
        this.shareToWxFriend(openid);
    }
    handleViewClose() {
        this.hideInviteView();
    }
    refreshInviteView() {
        if (!this._inviteView) {
            return;
        }
        this._inviteView.setViewState({
            users: this._users,
        });
    }
    loadFriendListFromWx() {
        if (this._isLoadingWxFriends) {
            return;
        }
        if (this._hasLoadedWxFriends) {
            return;
        }
        this._isLoadingWxFriends = true;
        wx.getFriendCloudStorage({
            keyList: ["invite_tag"],
            success: (res) => {
                this._users = this.mapWxFriendList(Array.isArray(res === null || res === void 0 ? void 0 : res.data) ? res.data : []);
                this._hasLoadedWxFriends = true;
                this.refreshIfVisible();
            },
            complete: () => {
                this._isLoadingWxFriends = false;
            }
        });
    }
    mapWxFriendList(list) {
        const result = [];
        const seen = new Set();
        for (const item of list || []) {
            const openid = typeof (item === null || item === void 0 ? void 0 : item.openid) === "string" ? item.openid.trim() : "";
            if (!openid || seen.has(openid)) {
                continue;
            }
            seen.add(openid);
            result.push({
                openid,
                nickName: this.pickDisplayName(item),
                avatarUrl: typeof (item === null || item === void 0 ? void 0 : item.avatarUrl) === "string" ? item.avatarUrl : ""
            });
        }
        return result;
    }
    shareToWxFriend(openid) {
        const query = "room_id=" + encodeURIComponent(String(this._shareConfig.roomId)) +
            "&room_name=" + encodeURIComponent(this._shareConfig.roomName) +
            "&invite_openid=" + encodeURIComponent(openid);
        const sharePayload = {
            title: this._shareConfig.shareTxt,
            imageUrl: this._shareConfig.shareImageUrl,
            imageUrlId: this._shareConfig.shareImageUrlId,
            query
        };
        wx.shareAppMessage(sharePayload);
    }
    pickDisplayName(item) {
        const name = (item === null || item === void 0 ? void 0 : item.nickName) || (item === null || item === void 0 ? void 0 : item.nickname);
        return typeof name === "string" && name.trim() ? name : "微信好友";
    }
    applyShareConfig(message) {
        this._shareConfig = {
            roomId: Number(message.room_id),
            roomName: String(message.room_name),
            shareTxt: String(message.share_txt),
            shareImageUrl: String(message.share_image_url),
            shareImageUrlId: String(message.share_image_url_id)
        };
    }
}
