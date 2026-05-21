(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result)
      __defProp(target, key, result);
    return result;
  };

  // src/opendata/OpenDataAssets.ts
  var OPEN_DATA_ASSETS = [
    "res://6b229f5a-2129-47db-9200-9a8e6decad99",
    "res://6d5fe075-a44e-46c0-ad3f-b0dc5d83ccd1",
    "res://63f8ea06-febb-4892-bca7-02b9ee46cd23",
    "res://b6a35890-ea0b-4652-9041-9e3dd20ced53"
  ];
  var INVITE_VIEW_RES = OPEN_DATA_ASSETS[0];

  // src/module/UISocialInviteView.ts
  var UISocialInviteView = class extends Laya.Sprite {
    constructor(_onInviteUser) {
      super();
      this._onInviteUser = _onInviteUser;
      this._state = null;
      this._root = null;
      this._list = null;
      this._loaded = false;
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
    layoutView() {
      this.layoutChildren();
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
    layoutChildren() {
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
      if ("numItems" in this._list && "itemRenderer" in this._list) {
        this._list.itemRenderer = (index, item) => {
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
      const count = typeof this._list.numChildren === "number" ? this._list.numChildren : 0;
      const max = Math.min(count, users.length);
      for (let i = 0; i < max; i++) {
        const item = (_b = (_a = this._list).getChildAt) == null ? void 0 : _b.call(_a, i);
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
      const openid = btnInvite == null ? void 0 : btnInvite.__inviteOpenid;
      if (openid) {
        this._onInviteUser(String(openid));
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
      } else if ("title" in node) {
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
  };

  // src/opendata/OpenDataCommand.ts
  var OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend",
    UpdateViewPort: "updateViewPort",
    Close: "close"
  };

  // src/opendata/InviteOpenDataModule.ts
  var InviteOpenDataModule = class {
    constructor(_stage) {
      this._stage = _stage;
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
      switch (message == null ? void 0 : message.type) {
        case OpenDataCommand.ShowInviteFriend:
          this.handleShowMessage(message);
          break;
        case OpenDataCommand.HideInviteFriend:
        case OpenDataCommand.Close:
          this.hideInviteView();
          break;
        case OpenDataCommand.UpdateViewPort:
          this.handleUpdateViewPort(message);
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
      this._inviteView.layoutView();
    }
    handleUpdateViewPort(message) {
      const box = message == null ? void 0 : message.box;
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
    handleShowMessage(message) {
      this.applyShareConfig(message);
      this.loadFriendListFromWx();
      this.showInviteView();
    }
    showInviteView() {
      if (!this._inviteView) {
        this._inviteView = new UISocialInviteView(this.handleInviteUser.bind(this));
      }
      this._inviteView.size(this._stage.width, this._stage.height);
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
    refreshInviteView() {
      if (!this._inviteView) {
        return;
      }
      this._inviteView.setViewState({
        users: this._users
      });
    }
    loadFriendListFromWx() {
      if (this._isLoadingWxFriends || this._hasLoadedWxFriends) {
        return;
      }
      if (typeof wx === "undefined" || !wx.getFriendCloudStorage) {
        return;
      }
      this._isLoadingWxFriends = true;
      wx.getFriendCloudStorage({
        keyList: ["invite_tag"],
        success: (res) => {
          this._users = this.mapWxFriendList(Array.isArray(res == null ? void 0 : res.data) ? res.data : []);
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
      const seen = /* @__PURE__ */ new Set();
      for (const item of list || []) {
        const openid = typeof (item == null ? void 0 : item.openid) === "string" ? item.openid.trim() : "";
        if (!openid || seen.has(openid)) {
          continue;
        }
        seen.add(openid);
        result.push({
          openid,
          nickName: this.pickDisplayName(item),
          avatarUrl: typeof (item == null ? void 0 : item.avatarUrl) === "string" ? item.avatarUrl : ""
        });
      }
      return result;
    }
    shareToWxFriend(openid) {
      if (typeof wx === "undefined") {
        return;
      }
      const query = "room_id=" + encodeURIComponent(String(this._shareConfig.roomId)) + "&room_name=" + encodeURIComponent(this._shareConfig.roomName) + "&invite_openid=" + encodeURIComponent(openid);
      const sharePayload = {
        title: this._shareConfig.shareTxt,
        imageUrl: this._shareConfig.shareImageUrl,
        query
      };
      const wxApi = wx;
      if (wxApi.shareMessageToFriend) {
        wxApi.shareMessageToFriend(__spreadProps(__spreadValues({}, sharePayload), { openId: openid }));
        return;
      }
      if (wxApi.shareAppMessage) {
        wxApi.shareAppMessage(__spreadProps(__spreadValues({}, sharePayload), {
          imageUrlId: this._shareConfig.shareImageUrlId
        }));
      }
    }
    pickDisplayName(item) {
      const name = (item == null ? void 0 : item.nickName) || (item == null ? void 0 : item.nickname);
      return typeof name === "string" && name.trim() ? name : "微信好友";
    }
    applyShareConfig(message) {
      this._shareConfig = {
        roomId: Number(message.room_id),
        roomName: String(message.room_name || ""),
        shareTxt: String(message.share_txt || ""),
        shareImageUrl: String(message.share_image_url || ""),
        shareImageUrlId: String(message.share_image_url_id || "")
      };
    }
  };

  // src/opendata/OpenDataApp.ts
  var OpenDataApp = class {
    constructor(_stage, _bridge) {
      this._stage = _stage;
      this._bridge = _bridge;
      this._started = false;
      this._inviteModule = new InviteOpenDataModule(this._stage);
    }
    start() {
      if (this._started) {
        return;
      }
      this._started = true;
      this._bridge.onMessage(this._inviteModule.handleMessage.bind(this._inviteModule));
      this._stage.on(Laya.Event.RESIZE, this._inviteModule, this._inviteModule.onStageResize);
    }
  };

  // src/opendata/WxOpenDataBridge.ts
  var WxOpenDataBridge = class {
    onMessage(handler) {
      const wxApi = typeof wx !== "undefined" ? wx : null;
      if (!(wxApi == null ? void 0 : wxApi.onMessage)) {
        return;
      }
      const engineHandler = this.getEngineMessageHandler();
      wxApi.onMessage((data) => {
        if (typeof engineHandler === "function") {
          engineHandler(data);
        }
        const message = data && typeof data.type === "string" ? data : { type: "" };
        handler(message);
      });
    }
    getEngineMessageHandler() {
      var _a, _b;
      const laya = Laya;
      return (_b = (_a = laya.MiniAdpter) == null ? void 0 : _a._onMessage) != null ? _b : null;
    }
  };

  // src/Main.ts
  var { regClass } = Laya;
  var Main = class extends Laya.Script {
    constructor() {
      super(...arguments);
      this._openDataApp = null;
    }
    onAwake() {
      this.preloadOpenDataAssets().catch((err) => console.error("[OpenData] 资源预加载失败:", err)).then(() => this.startOpenDataApp());
    }
    startOpenDataApp() {
      this._openDataApp = new OpenDataApp(Laya.stage, new WxOpenDataBridge());
      this._openDataApp.start();
    }
    preloadOpenDataAssets() {
      const tasks = OPEN_DATA_ASSETS.map((url) => {
        const task = Laya.loader.load(url);
        if (task && typeof task.then === "function") {
          return task;
        }
        return new Promise((resolve) => {
          Laya.loader.load(url, Laya.Handler.create(null, () => resolve()));
        });
      });
      return Promise.all(tasks).then(() => void 0);
    }
  };
  Main = __decorateClass([
    regClass("e60XQm7tTY2BwFAdxb8D1g")
  ], Main);
})();
