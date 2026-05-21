const INVITE_VIEW_RES = "res://6b229f5a-2129-47db-9200-9a8e6decad99";
export default class UISocialInviteView extends Laya.Sprite {
    constructor(_onInviteUser, _onClose) {
        super();
        this._onInviteUser = _onInviteUser;
        this._onClose = _onClose;
        this._state = null;
        this._root = null;
        this._list = null;
        this._loaded = false;
        this._renderHandler = null;
        this.size(Laya.stage.width, Laya.stage.height);
        this.loadView();
    }
    setViewState(state) {
        this._state = state;
        this.refresh();
    }
    onHide() {
        this.visible = false;
    }
    loadView() {
        const loadTask = Laya.loader.load(INVITE_VIEW_RES);
        if (loadTask && typeof loadTask.then === "function") {
            loadTask.then(() => this.onViewLoaded()).catch(() => void 0);
            return;
        }
        Laya.loader.load(INVITE_VIEW_RES, Laya.Handler.create(this, this.onViewLoaded));
    }
    onViewLoaded() {
        const loader = Laya.loader;
        const root = typeof loader.createNodes === "function" ? loader.createNodes(INVITE_VIEW_RES) : null;
        if (!root) {
            return;
        }
        this._root = root;
        this.addChild(root);
        this._list = this.findNodeByName(this._root, "list_items");
        this.bindCloseButton();
        this._loaded = true;
        this.refresh();
    }
    refresh() {
        if (!this._loaded || !this._state) {
            return;
        }
        this.visible = true;
        this.refreshList(this._state.users);
    }
    refreshList(users) {
        var _a, _b;
        if (!this._list) {
            return;
        }
        if ("array" in this._list && "renderHandler" in this._list) {
            if (!this._renderHandler) {
                this._renderHandler = Laya.Handler.create(this, this.renderListItem, null, false);
            }
            this._list.renderHandler = this._renderHandler;
            this._list.array = users;
            if (typeof this._list.refresh === "function") {
                this._list.refresh();
            }
            return;
        }
        const count = typeof this._list.numChildren === "number" ? this._list.numChildren : 0;
        const max = Math.min(count, users.length);
        for (let i = 0; i < max; i++) {
            const item = (_b = (_a = this._list).getChildAt) === null || _b === void 0 ? void 0 : _b.call(_a, i);
            this.applyUserToItem(item, users[i]);
        }
    }
    renderListItem(arg0, arg1) {
        if (!this._state) {
            return;
        }
        let item = null;
        let index = 0;
        if (typeof arg0 === "number") {
            index = arg0;
            item = arg1;
        }
        else {
            item = arg0;
            index = Number(arg1 || 0);
        }
        const user = this._state.users[index];
        if (!user) {
            return;
        }
        this.applyUserToItem(item, user);
    }
    applyUserToItem(item, user) {
        if (!item || !user) {
            return;
        }
        const refs = this.getItemRefs(item);
        this.setText(refs.txtNick, user.nickName);
        this.setImageSource(refs.imgHead, user.avatarUrl);
        this.setText(refs.txtTitle, "邀请");
        this.bindInvite(refs.btnInvite, user);
    }
    bindInvite(btnInvite, user) {
        if (!btnInvite) {
            return;
        }
        btnInvite.__inviteOpenid = user.openid;
        btnInvite.mouseEnabled = true;
        btnInvite.grayed = false;
        btnInvite.touchable = true;
        if (btnInvite.__inviteBound) {
            return;
        }
        btnInvite.__inviteBound = true;
        if (typeof btnInvite.on === "function") {
            btnInvite.on(Laya.Event.CLICK, this, this.handleInviteClick);
        }
    }
    handleInviteClick(evt) {
        const btnInvite = evt.currentTarget;
        const openid = btnInvite === null || btnInvite === void 0 ? void 0 : btnInvite.__inviteOpenid;
        if (openid) {
            this._onInviteUser(String(openid));
        }
    }
    bindCloseButton() {
        const btnClose = this.findNodeByName(this._root, "btn_close");
        if (!btnClose || btnClose.__closeBound) {
            return;
        }
        btnClose.__closeBound = true;
        if (typeof btnClose.on === "function") {
            btnClose.on(Laya.Event.CLICK, this, this._onClose);
        }
    }
    getItemRefs(item) {
        if (item.__inviteRefs) {
            return item.__inviteRefs;
        }
        const btnInvite = this.findNodeByName(item, "btn_invite");
        const refs = {
            txtNick: this.findNodeByName(item, "txt_nick"),
            imgHead: this.findNodeByName(item, "img_head"),
            btnInvite,
            txtTitle: this.findNodeByName(btnInvite, "txt_title")
        };
        item.__inviteRefs = refs;
        return refs;
    }
    setText(node, text) {
        if (!node) {
            return;
        }
        if ("text" in node) {
            node.text = text;
        }
        else if ("title" in node) {
            node.title = text;
        }
    }
    setImageSource(node, url) {
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
    findNodeByName(root, name) {
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
