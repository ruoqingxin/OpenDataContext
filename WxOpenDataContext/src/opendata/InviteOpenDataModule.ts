import UISocialInviteView from "../module/UISocialInviteView";
import { OpenDataCommand } from "./OpenDataCommand";
import { InviteUser, OpenDataBridge, OpenDataMessage } from "./types";

interface WxFriendCloudStorageItem {
    openid?: string;
    avatarUrl?: string;
    nickname?: string;
    nickName?: string;
}

interface WxFriendCloudStorageResponse {
    data?: WxFriendCloudStorageItem[];
}

interface InviteShowMessage extends OpenDataMessage {
    room_id: number;
    room_name: string;
    share_txt: string;
    share_image_url: string;
    share_image_url_id: string;
}

interface ViewPortMessage extends OpenDataMessage {
    box?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
}

interface InviteShareConfig {
    roomId: number;
    roomName: string;
    shareTxt: string;
    shareImageUrl: string;
    shareImageUrlId: string;
}

export default class InviteOpenDataModule {
    private _users: InviteUser[] = [];
    private _inviteView: UISocialInviteView | null = null;
    private _isLoadingWxFriends = false;
    private _hasLoadedWxFriends = false;

    private _shareConfig: InviteShareConfig = {
        roomId: 0,
        roomName: "",
        shareTxt: "",
        shareImageUrl: "",
        shareImageUrlId: "",
    };

    constructor(private _stage: Laya.Stage, private _bridge: OpenDataBridge) { }

    public handleMessage(message: OpenDataMessage): void {
        switch (message?.type) {
            case OpenDataCommand.ShowInviteFriend:
                this.handleShowMessage(message as InviteShowMessage);
                break;
            case OpenDataCommand.HideInviteFriend:
            case OpenDataCommand.Close:
                this.hideInviteView();
                break;
            case OpenDataCommand.UpdateViewPort:
                this.handleUpdateViewPort(message as ViewPortMessage);
                break;
            default:
                break;
        }
    }

    public onStageResize(): void {
        if (!this._inviteView) {
            return;
        }
        this._inviteView.size(this._stage.width, this._stage.height);
        this._inviteView.layoutView();
    }

    private handleUpdateViewPort(message: ViewPortMessage): void {
        const box = message?.box;
        if (!box) {
            return;
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
    }

    private handleShowMessage(message: InviteShowMessage): void {
        this.applyShareConfig(message);
        this.loadFriendListFromWx();
        this.showInviteView();
    }

    private showInviteView(): void {
        if (!this._inviteView) {
            this._inviteView = new UISocialInviteView(
                this.handleInviteUser.bind(this),
                this.handleViewClose.bind(this)
            );
        }

        this._inviteView.size(this._stage.width, this._stage.height);
        this.refreshInviteView();

        if (!this._inviteView.parent) {
            this._stage.addChild(this._inviteView);
        }
        this._inviteView.visible = true;
    }

    private hideInviteView(): void {
        if (!this._inviteView) {
            return;
        }
        this._inviteView.onHide();
        this._inviteView.removeSelf();
    }

    private refreshIfVisible(): void {
        if (!this._inviteView || !this._inviteView.parent) {
            return;
        }
        this.refreshInviteView();
    }

    private handleInviteUser(openid: string): void {
        this.shareToWxFriend(openid);
    }

    private handleViewClose(): void {
        this.hideInviteView();
    }

    private refreshInviteView(): void {
        if (!this._inviteView) {
            return;
        }
        this._inviteView.setViewState({
            users: this._users,
        });
    }

    private loadFriendListFromWx(): void {
        if (this._isLoadingWxFriends || this._hasLoadedWxFriends) {
            return;
        }
        if (typeof wx === "undefined" || !wx.getFriendCloudStorage) {
            return;
        }

        this._isLoadingWxFriends = true;
        wx.getFriendCloudStorage({
            keyList: ["invite_tag"],
            success: (res: WxFriendCloudStorageResponse) => {
                this._users = this.mapWxFriendList(Array.isArray(res?.data) ? res.data : []);
                this._hasLoadedWxFriends = true;
                this.refreshIfVisible();
            },
            complete: () => {
                this._isLoadingWxFriends = false;
            },
        });
    }

    private mapWxFriendList(list: WxFriendCloudStorageItem[]): InviteUser[] {
        const result: InviteUser[] = [];
        const seen = new Set<string>();

        for (const item of list || []) {
            const openid = typeof item?.openid === "string" ? item.openid.trim() : "";
            if (!openid || seen.has(openid)) {
                continue;
            }
            seen.add(openid);
            result.push({
                openid,
                nickName: this.pickDisplayName(item),
                avatarUrl: typeof item?.avatarUrl === "string" ? item.avatarUrl : "",
            });
        }
        return result;
    }

    private shareToWxFriend(openid: string): void {
        if (typeof wx === "undefined") {
            return;
        }

        const query =
            "room_id=" + encodeURIComponent(String(this._shareConfig.roomId)) +
            "&room_name=" + encodeURIComponent(this._shareConfig.roomName) +
            "&invite_openid=" + encodeURIComponent(openid);

        const sharePayload = {
            title: this._shareConfig.shareTxt,
            imageUrl: this._shareConfig.shareImageUrl,
            query,
        };

        const wxApi = wx as any;
        if (wxApi.shareMessageToFriend) {
            wxApi.shareMessageToFriend({ ...sharePayload, openId: openid });
            return;
        }

        if (wxApi.shareAppMessage) {
            wxApi.shareAppMessage({
                ...sharePayload,
                imageUrlId: this._shareConfig.shareImageUrlId,
            });
        }
    }

    private pickDisplayName(item: WxFriendCloudStorageItem): string {
        const name = item?.nickName || item?.nickname;
        return typeof name === "string" && name.trim() ? name : "微信好友";
    }

    private applyShareConfig(message: InviteShowMessage): void {
        this._shareConfig = {
            roomId: Number(message.room_id),
            roomName: String(message.room_name || ""),
            shareTxt: String(message.share_txt || ""),
            shareImageUrl: String(message.share_image_url || ""),
            shareImageUrlId: String(message.share_image_url_id || ""),
        };
    }
}
