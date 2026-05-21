import UISocialInviteView from "./UISocialInviteView";
import { InviteUser, OpenDataCommand, OpenDataMessage } from "./types";

interface WxFriendItem {
    openid?: string;
    avatarUrl?: string;
    nickname?: string;
    nickName?: string;
}

export default class InviteOpenDataModule {
    private _users: InviteUser[] = [];
    private _inviteView: UISocialInviteView | null = null;
    private _loadingFriends = false;
    private _loadedFriends = false;
    private _shareConfig = {
        roomId: 0,
        roomName: "",
        shareTxt: "",
        shareImageUrl: "",
        shareImageUrlId: "",
    };

    constructor(private _stage: Laya.Stage) { }

    public handleMessage(message: OpenDataMessage): void {
        switch (message?.type) {
            case OpenDataCommand.ShowInviteFriend:
                this._shareConfig = {
                    roomId: Number(message.room_id),
                    roomName: String(message.room_name || ""),
                    shareTxt: String(message.share_txt || ""),
                    shareImageUrl: String(message.share_image_url || ""),
                    shareImageUrlId: String(message.share_image_url_id || ""),
                };
                this.loadFriends();
                this.showView();
                break;
            case OpenDataCommand.HideInviteFriend:
            case OpenDataCommand.Close:
                this.hideView();
                break;
            case OpenDataCommand.UpdateViewPort: {
                const box = message.box as { width?: number; height?: number } | undefined;
                if (!box) {
                    break;
                }
                const width = Math.max(1, Math.floor(Number(box.width) || 0));
                const height = Math.max(1, Math.floor(Number(box.height) || 0));
                this._stage.size(width, height);
                const canvas = typeof wx !== "undefined" && wx.getSharedCanvas ? wx.getSharedCanvas() : null;
                if (canvas) {
                    canvas.width = width;
                    canvas.height = height;
                }
                this.onStageResize();
                break;
            }
        }
    }

    public onStageResize(): void {
        if (!this._inviteView) {
            return;
        }
        this._inviteView.size(this._stage.width, this._stage.height);
        this._inviteView.layout();
    }

    private showView(): void {
        if (!this._inviteView) {
            this._inviteView = new UISocialInviteView((openid) => this.shareToFriend(openid));
        }
        this._inviteView.size(this._stage.width, this._stage.height);
        this._inviteView.setUsers(this._users);
        if (!this._inviteView.parent) {
            this._stage.addChild(this._inviteView);
        }
        this._inviteView.visible = true;
    }

    private hideView(): void {
        this._inviteView?.removeSelf();
    }

    private refreshView(): void {
        if (this._inviteView?.parent) {
            this._inviteView.setUsers(this._users);
        }
    }

    private loadFriends(): void {
        if (this._loadingFriends || this._loadedFriends || typeof wx === "undefined" || !wx.getFriendCloudStorage) {
            return;
        }
        this._loadingFriends = true;
        wx.getFriendCloudStorage({
            keyList: ["invite_tag"],
            success: (res) => {
                this._users = this.mapFriends(Array.isArray(res?.data) ? res.data : []);
                this._loadedFriends = true;
                this.refreshView();
            },
            complete: () => {
                this._loadingFriends = false;
            },
        });
    }

    private mapFriends(list: WxFriendItem[]): InviteUser[] {
        const result: InviteUser[] = [];
        const seen = new Set<string>();
        for (const item of list) {
            const openid = typeof item?.openid === "string" ? item.openid.trim() : "";
            if (!openid || seen.has(openid)) {
                continue;
            }
            seen.add(openid);
            const name = item?.nickName || item?.nickname;
            result.push({
                openid,
                nickName: typeof name === "string" && name.trim() ? name : "微信好友",
                avatarUrl: typeof item?.avatarUrl === "string" ? item.avatarUrl : "",
            });
        }
        return result;
    }

    private shareToFriend(openid: string): void {
        if (typeof wx === "undefined") {
            return;
        }
        const query =
            "room_id=" + encodeURIComponent(String(this._shareConfig.roomId)) +
            "&room_name=" + encodeURIComponent(this._shareConfig.roomName) +
            "&invite_openid=" + encodeURIComponent(openid);
        const payload = {
            title: this._shareConfig.shareTxt,
            imageUrl: this._shareConfig.shareImageUrl,
            query,
        };
        const wxApi = wx as typeof wx & {
            shareMessageToFriend?: (opts: typeof payload & { openId: string }) => void;
            shareAppMessage?: (opts: typeof payload & { imageUrlId: string }) => void;
        };
        if (wxApi.shareMessageToFriend) {
            wxApi.shareMessageToFriend({ ...payload, openId: openid });
        } else if (wxApi.shareAppMessage) {
            wxApi.shareAppMessage({ ...payload, imageUrlId: this._shareConfig.shareImageUrlId });
        }
    }
}
