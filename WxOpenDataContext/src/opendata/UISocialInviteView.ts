import { InviteUser } from "./types";

const ITEM_HEIGHT = 88;
const LIST_TOP = 52;

export default class UISocialInviteView extends Laya.Sprite {
    private _listPanel = new Laya.Panel();
    private _emptyLabel = new Laya.Label();
    private _btnClose = new Laya.Button();

    constructor(
        private _onInvite: (openid: string) => void,
        private _onClose: () => void
    ) {
        super();
        this.buildUI();
    }

    public setUsers(users: InviteUser[]): void {
        this.visible = true;
        this.layout();
        this._listPanel.removeChildren();

        const list = users || [];
        this._emptyLabel.visible = list.length === 0;
        this._listPanel.visible = list.length > 0;
        list.forEach((user, index) => {
            this._listPanel.addChild(this.createItem(user, index));
        });
        this._listPanel.refresh();
    }

    public layout(): void {
        const w = this.width;
        const h = this.height;
        this._btnClose.x = w - this._btnClose.width - 12;
        this._btnClose.y = 8;
        this._listPanel.pos(0, LIST_TOP);
        this._listPanel.size(w, Math.max(0, h - LIST_TOP));
        this._emptyLabel.pos(0, LIST_TOP);
        this._emptyLabel.size(w, Math.max(0, h - LIST_TOP));
    }

    private buildUI(): void {
        this._listPanel.vScrollBarSkin = "";
        this.addChild(this._listPanel);

        this._emptyLabel.text = "暂无可邀请的微信好友";
        this._emptyLabel.fontSize = 24;
        this._emptyLabel.color = "#999999";
        this._emptyLabel.align = "center";
        this._emptyLabel.valign = "middle";
        this._emptyLabel.visible = false;
        this.addChild(this._emptyLabel);

        this._btnClose.label = "关闭";
        this._btnClose.size(80, 40);
        this._btnClose.on(Laya.Event.CLICK, this, this._onClose);
        this.addChild(this._btnClose);
    }

    private createItem(user: InviteUser, index: number): Laya.Box {
        const item = new Laya.Box();
        item.size(this.width, ITEM_HEIGHT);
        item.y = index * ITEM_HEIGHT;

        const bg = new Laya.Sprite();
        bg.graphics.drawRect(0, 0, item.width, item.height, "#ffffff");
        item.addChild(bg);

        const imgHead = new Laya.Image();
        imgHead.size(64, 64);
        imgHead.pos(16, 12);
        if (user.avatarUrl) {
            imgHead.skin = user.avatarUrl;
        }
        item.addChild(imgHead);

        const txtNick = new Laya.Label();
        txtNick.text = user.nickName;
        txtNick.fontSize = 26;
        txtNick.color = "#333333";
        txtNick.pos(92, 28);
        txtNick.size(Math.max(0, item.width - 220), 32);
        txtNick.overflow = "hidden";
        item.addChild(txtNick);

        const btnInvite = new Laya.Button();
        btnInvite.label = "邀请";
        btnInvite.size(96, 48);
        btnInvite.pos(item.width - 112, 20);
        btnInvite.on(Laya.Event.CLICK, this, () => this._onInvite(user.openid));
        item.addChild(btnInvite);

        return item;
    }
}
