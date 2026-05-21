import { InviteUser, InviteViewState } from "../opendata/types";

const ITEM_HEIGHT = 88;

export default class UISocialInviteView extends Laya.Sprite {
    private _listPanel: Laya.Panel | null = null;
    private _emptyLabel: Laya.Label | null = null;

    constructor(
        private _onInviteUser: (openid: string) => void,
        private _onClose: () => void
    ) {
        super();
        this.size(Laya.stage.width, Laya.stage.height);
        this.buildUI();
    }

    public setViewState(state: InviteViewState): void {
        this.visible = true;
        this.refreshList(state.users || []);
    }

    public onHide(): void {
        this.visible = false;
    }

    public layoutView(): void {
        this.layoutChildren();
    }

    private buildUI(): void {
        this._listPanel = new Laya.Panel();
        this._listPanel.vScrollBarSkin = "";
        this.addChild(this._listPanel);

        this._emptyLabel = new Laya.Label();
        this._emptyLabel.text = "暂无可邀请的微信好友";
        this._emptyLabel.fontSize = 24;
        this._emptyLabel.color = "#999999";
        this._emptyLabel.align = "center";
        this._emptyLabel.valign = "middle";
        this._emptyLabel.visible = false;
        this.addChild(this._emptyLabel);

        const btnClose = new Laya.Button();
        btnClose.label = "关闭";
        btnClose.width = 80;
        btnClose.height = 40;
        btnClose.on(Laya.Event.CLICK, this, this._onClose);
        btnClose.name = "btn_close";
        this.addChild(btnClose);
    }

    private layoutChildren(): void {
        const w = this.width;
        const h = this.height;

        const btnClose = this.getChildByName("btn_close") as Laya.Button | null;
        if (btnClose) {
            btnClose.x = w - btnClose.width - 12;
            btnClose.y = 8;
        }

        const listTop = 52;
        if (this._listPanel) {
            this._listPanel.x = 0;
            this._listPanel.y = listTop;
            this._listPanel.width = w;
            this._listPanel.height = Math.max(0, h - listTop);
        }
        if (this._emptyLabel) {
            this._emptyLabel.width = w;
            this._emptyLabel.height = Math.max(0, h - listTop);
            this._emptyLabel.y = listTop;
        }
    }

    private refreshList(users: InviteUser[]): void {
        if (!this._listPanel || !this._emptyLabel) {
            return;
        }

        this.layoutChildren();
        this._listPanel.removeChildren();

        const list = users || [];
        this._emptyLabel.visible = list.length <= 0;
        this._listPanel.visible = list.length > 0;

        list.forEach((user, index) => {
            this._listPanel!.addChild(this.createListItem(user, index));
        });
        this._listPanel.refresh();
    }

    private createListItem(user: InviteUser, index: number): Laya.Box {
        const item = new Laya.Box();
        item.width = this.width;
        item.height = ITEM_HEIGHT;
        item.y = index * ITEM_HEIGHT;

        const bg = new Laya.Sprite();
        bg.graphics.drawRect(0, 0, item.width, item.height, "#ffffff");
        item.addChild(bg);

        const imgHead = new Laya.Image();
        imgHead.width = 64;
        imgHead.height = 64;
        imgHead.x = 16;
        imgHead.y = 12;
        if (user.avatarUrl) {
            imgHead.skin = user.avatarUrl;
        }
        item.addChild(imgHead);

        const txtNick = new Laya.Label();
        txtNick.text = user.nickName || "微信好友";
        txtNick.fontSize = 26;
        txtNick.color = "#333333";
        txtNick.x = 92;
        txtNick.y = 28;
        txtNick.width = Math.max(0, item.width - 220);
        txtNick.overflow = "hidden";
        item.addChild(txtNick);

        const btnInvite = new Laya.Button();
        btnInvite.label = "邀请";
        btnInvite.width = 96;
        btnInvite.height = 48;
        btnInvite.x = item.width - btnInvite.width - 16;
        btnInvite.y = 20;
        btnInvite.on(Laya.Event.CLICK, this, () => {
            if (user.openid) {
                this._onInviteUser(String(user.openid));
            }
        });
        item.addChild(btnInvite);

        return item;
    }
}
