import { INVITE_VIEW_RES } from "../opendata/OpenDataAssets";
import { InviteUser, InviteViewState } from "../opendata/types";

interface InviteItemRefs {
    txtNick: any;
    imgHead: any;
    btnInvite: any;
    txtTitle: any;
}

export default class UISocialInviteView extends Laya.Sprite {
    private _state: InviteViewState | null = null;
    private _root: any = null;
    private _list: any = null;
    private _loaded = false;

    constructor(private _onInviteUser: (openid: string) => void) {
        super();
        this.size(Laya.stage.width, Laya.stage.height);
        this.loadView();
    }

    public setViewState(state: InviteViewState): void {
        this._state = state;
        this.refresh();
    }

    public onHide(): void {
        this.visible = false;
    }

    public layoutView(): void {
        this.layoutChildren();
    }

    private loadView(): void {
        const loadTask: any = Laya.loader.load(INVITE_VIEW_RES);
        if (loadTask && typeof loadTask.then === "function") {
            loadTask.then(() => this.onViewLoaded()).catch(() => void 0);
            return;
        }
        Laya.loader.load(INVITE_VIEW_RES, Laya.Handler.create(this, this.onViewLoaded));
    }

    private onViewLoaded(): void {
        const loader: any = Laya.loader as any;
        const root: any = typeof loader.createNodes === "function" ? loader.createNodes(INVITE_VIEW_RES) : null;
        if (!root) {
            console.error("[OpenData] 邀请列表预制体加载失败:", INVITE_VIEW_RES);
            return;
        }

        this._root = root;
        this.addChild(root);
        this._list = this.findNodeByName(this._root, "list_items");
        this._loaded = true;
        this.layoutChildren();
        this.refresh();
    }

    private layoutChildren(): void {
        if (!this._root) {
            return;
        }
        this._root.size(this.width, this.height);
        const list = this._list;
        if (list && typeof list.size === "function") {
            list.width = this.width - (list.x || 0) * 2;
            list.height = this.height - (list.y || 0);
        }
    }

    private refresh(): void {
        if (!this._loaded || !this._state) {
            return;
        }
        this.visible = true;
        this.refreshList(this._state.users);
    }

    private refreshList(users: InviteUser[]): void {
        if (!this._list) {
            return;
        }

        if ("numItems" in this._list && "itemRenderer" in this._list) {
            this._list.itemRenderer = (index: number, item: any) => {
                this.applyUserToItem(item, users[index]);
            };
            this._list.numItems = users.length;
            return;
        }

        if ("renderHandler" in this._list && "array" in this._list) {
            this._list.renderHandler = Laya.Handler.create(this, this.renderListItem, null, false);
            this._list.array = users;
            if (typeof this._list.refresh === "function") {
                this._list.refresh();
            }
            return;
        }

        const count: number = typeof this._list.numChildren === "number" ? this._list.numChildren : 0;
        const max = Math.min(count, users.length);
        for (let i = 0; i < max; i++) {
            const item = this._list.getChildAt?.(i);
            this.applyUserToItem(item, users[i]);
        }
    }

    private renderListItem(arg0: any, arg1: any): void {
        if (!this._state) {
            return;
        }

        let item: any = null;
        let index = 0;
        if (typeof arg0 === "number") {
            index = arg0;
            item = arg1;
        } else {
            item = arg0;
            index = Number(arg1 || 0);
        }

        const user = this._state.users[index];
        if (!user) {
            return;
        }
        this.applyUserToItem(item, user);
    }

    private applyUserToItem(item: any, user: InviteUser): void {
        if (!item || !user) {
            return;
        }
        const refs = this.getItemRefs(item);

        this.setText(refs.txtNick, user.nickName);
        this.setImageSource(refs.imgHead, user.avatarUrl);
        this.setText(refs.txtTitle, "邀请");
        this.bindInvite(refs.btnInvite, user);
    }

    private bindInvite(btnInvite: any, user: InviteUser): void {
        if (!btnInvite) {
            return;
        }
        btnInvite.__inviteOpenid = user.openid;
        btnInvite.mouseEnabled = true;
        btnInvite.touchable = true;
        if (btnInvite.__inviteBound) {
            return;
        }
        btnInvite.__inviteBound = true;
        if (typeof btnInvite.on === "function") {
            btnInvite.on(Laya.Event.CLICK, this, this.handleInviteClick);
        }
    }

    private handleInviteClick(evt: Laya.Event): void {
        const btnInvite: any = evt.currentTarget;
        const openid = btnInvite?.__inviteOpenid;
        if (openid) {
            this._onInviteUser(String(openid));
        }
    }

    private getItemRefs(item: any): InviteItemRefs {
        if (item.__inviteRefs) {
            return item.__inviteRefs as InviteItemRefs;
        }
        const btnInvite = this.findNodeByName(item, "btn_invite");
        const refs: InviteItemRefs = {
            txtNick: this.findNodeByName(item, "txt_nick"),
            imgHead: this.findNodeByName(item, "img_head"),
            btnInvite,
            txtTitle: this.findNodeByName(btnInvite, "txt_title"),
        };
        item.__inviteRefs = refs;
        return refs;
    }

    private setText(node: any, text: string): void {
        if (!node) {
            return;
        }
        if ("text" in node) {
            node.text = text;
        } else if ("title" in node) {
            node.title = text;
        }
    }

    private setImageSource(node: any, url: string): void {
        if (!node) {
            return;
        }
        if ("url" in node) {
            node.url = url || "";
            return;
        }
        if ("src" in node) {
            node.src = url || "";
            return;
        }
        if ("skin" in node) {
            node.skin = url || "";
        }
    }

    private findNodeByName(root: any, name: string): any {
        if (!root || !name) {
            return null;
        }
        if (typeof root.getChildByName === "function") {
            const direct = root.getChildByName(name);
            if (direct) {
                return direct;
            }
        }
        if (typeof root.numChildren !== "number" || typeof root.getChildAt !== "function") {
            return null;
        }
        for (let i = 0; i < root.numChildren; i++) {
            const child = root.getChildAt(i);
            const result = this.findNodeByName(child, name);
            if (result) {
                return result;
            }
        }
        return null;
    }
}
