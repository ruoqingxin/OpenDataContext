(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/module/UISocialInviteView.ts
  var ITEM_HEIGHT = 88;
  var _UISocialInviteView = class _UISocialInviteView extends Laya.Sprite {
    constructor(_onInviteUser, _onClose) {
      super();
      this._onInviteUser = _onInviteUser;
      this._onClose = _onClose;
      this._listPanel = null;
      this._emptyLabel = null;
      this.size(Laya.stage.width, Laya.stage.height);
      this.buildUI();
    }
    setViewState(state) {
      this.visible = true;
      this.refreshList((state == null ? void 0 : state.users) || []);
    }
    onHide() {
      this.visible = false;
    }
    layoutView() {
      this.layoutChildren();
    }
    buildUI() {
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
    layoutChildren() {
      const w = this.width;
      const h = this.height;
      const btnClose = this.getChildByName("btn_close");
      if (btnClose) {
        btnClose.x = w - btnClose.width - 12;
        btnClose.y = 8;
      }
      const listTop = 52;
      this._listPanel.x = 0;
      this._listPanel.y = listTop;
      this._listPanel.width = w;
      this._listPanel.height = Math.max(0, h - listTop);
      this._emptyLabel.width = w;
      this._emptyLabel.height = Math.max(0, h - listTop);
      this._emptyLabel.y = listTop;
    }
    refreshList(users) {
      this.layoutChildren();
      this._listPanel.removeChildren();
      const list = users || [];
      this._emptyLabel.visible = list.length <= 0;
      this._listPanel.visible = list.length > 0;
      list.forEach((user, index) => {
        this._listPanel.addChild(this.createListItem(user, index));
      });
      this._listPanel.refresh();
    }
    createListItem(user, index) {
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
  };
  __name(_UISocialInviteView, "UISocialInviteView");
  var UISocialInviteView = _UISocialInviteView;

  // src/opendata/OpenDataCommand.ts
  var OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend",
    UpdateViewPort: "updateViewPort",
    Close: "close"
  };

  // src/opendata/InviteOpenDataModule.ts
  var _InviteOpenDataModule = class _InviteOpenDataModule {
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
        wxApi.shareMessageToFriend(Object.assign({ openId: openid }, sharePayload));
        return;
      }
      if (wxApi.shareAppMessage) {
        wxApi.shareAppMessage(Object.assign({ imageUrlId: this._shareConfig.shareImageUrlId }, sharePayload));
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
  __name(_InviteOpenDataModule, "InviteOpenDataModule");
  var InviteOpenDataModule = _InviteOpenDataModule;

  // src/opendata/WxOpenDataBridge.ts
  var _WxOpenDataBridge = class _WxOpenDataBridge {
    onMessage(handler) {
      const wxApi = typeof wx !== "undefined" ? wx : null;
      if (!(wxApi == null ? void 0 : wxApi.onMessage)) {
        return;
      }
      const engineHandler = Laya.MiniAdpter && Laya.MiniAdpter._onMessage;
      wxApi.onMessage((data) => {
        if (typeof engineHandler === "function") {
          engineHandler(data);
        }
        const message = data && typeof data.type === "string" ? data : { type: "" };
        handler(message);
      });
    }
  };
  __name(_WxOpenDataBridge, "WxOpenDataBridge");
  var WxOpenDataBridge = _WxOpenDataBridge;

  // src/opendata/OpenDataApp.ts
  var _OpenDataApp = class _OpenDataApp {
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
  __name(_OpenDataApp, "OpenDataApp");
  var OpenDataApp = _OpenDataApp;

  // src/Main.ts
  var DESIGN_WIDTH = 720;
  var DESIGN_HEIGHT = 480;
  Laya.init(DESIGN_WIDTH, DESIGN_HEIGHT);
  Laya.stage.scaleMode = Laya.Stage.SCALE_SHOWALL;
  Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
  Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
  const openDataApp = new OpenDataApp(Laya.stage, new WxOpenDataBridge());
  openDataApp.start();
})();
