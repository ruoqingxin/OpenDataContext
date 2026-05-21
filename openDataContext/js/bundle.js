(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/opendata/types.ts
  var OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend",
    UpdateViewPort: "updateViewPort",
    Close: "close"
  };

  // src/opendata/UISocialInviteView.ts
  var ITEM_HEIGHT = 88;
  var LIST_TOP = 52;
  var _UISocialInviteView = class _UISocialInviteView extends Laya.Sprite {
    constructor(_onInvite, _onClose) {
      super();
      this._onInvite = _onInvite;
      this._onClose = _onClose;
      this._listPanel = new Laya.Panel();
      this._emptyLabel = new Laya.Label();
      this._btnClose = new Laya.Button();
      this.buildUI();
    }
    setUsers(users) {
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
    layout() {
      const w = this.width;
      const h = this.height;
      this._btnClose.x = w - this._btnClose.width - 12;
      this._btnClose.y = 8;
      this._listPanel.pos(0, LIST_TOP);
      this._listPanel.size(w, Math.max(0, h - LIST_TOP));
      this._emptyLabel.pos(0, LIST_TOP);
      this._emptyLabel.size(w, Math.max(0, h - LIST_TOP));
    }
    buildUI() {
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
    createItem(user, index) {
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
  };
  __name(_UISocialInviteView, "UISocialInviteView");
  var UISocialInviteView = _UISocialInviteView;

  // src/opendata/InviteOpenDataModule.ts
  var _InviteOpenDataModule = class _InviteOpenDataModule {
    constructor(_stage) {
      this._stage = _stage;
      this._users = [];
      this._inviteView = null;
      this._loadingFriends = false;
      this._loadedFriends = false;
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
          this._shareConfig = {
            roomId: Number(message.room_id),
            roomName: String(message.room_name || ""),
            shareTxt: String(message.share_txt || ""),
            shareImageUrl: String(message.share_image_url || ""),
            shareImageUrlId: String(message.share_image_url_id || "")
          };
          this.loadFriends();
          this.showView();
          break;
        case OpenDataCommand.HideInviteFriend:
        case OpenDataCommand.Close:
          this.hideView();
          break;
        case OpenDataCommand.UpdateViewPort: {
          const box = message.box;
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
    onStageResize() {
      if (!this._inviteView) {
        return;
      }
      this._inviteView.size(this._stage.width, this._stage.height);
      this._inviteView.layout();
    }
    showView() {
      if (!this._inviteView) {
        this._inviteView = new UISocialInviteView(
          (openid) => this.shareToFriend(openid),
          () => this.hideView()
        );
      }
      this._inviteView.size(this._stage.width, this._stage.height);
      this._inviteView.setUsers(this._users);
      if (!this._inviteView.parent) {
        this._stage.addChild(this._inviteView);
      }
      this._inviteView.visible = true;
    }
    hideView() {
      var _a;
      (_a = this._inviteView) == null ? void 0 : _a.removeSelf();
    }
    refreshView() {
      var _a;
      if ((_a = this._inviteView) == null ? void 0 : _a.parent) {
        this._inviteView.setUsers(this._users);
      }
    }
    loadFriends() {
      if (this._loadingFriends || this._loadedFriends || typeof wx === "undefined" || !wx.getFriendCloudStorage) {
        return;
      }
      this._loadingFriends = true;
      wx.getFriendCloudStorage({
        keyList: ["invite_tag"],
        success: (res) => {
          this._users = this.mapFriends(Array.isArray(res == null ? void 0 : res.data) ? res.data : []);
          this._loadedFriends = true;
          this.refreshView();
        },
        complete: () => {
          this._loadingFriends = false;
        }
      });
    }
    mapFriends(list) {
      const result = [];
      const seen = /* @__PURE__ */ new Set();
      for (const item of list) {
        const openid = typeof (item == null ? void 0 : item.openid) === "string" ? item.openid.trim() : "";
        if (!openid || seen.has(openid)) {
          continue;
        }
        seen.add(openid);
        const name = (item == null ? void 0 : item.nickName) || (item == null ? void 0 : item.nickname);
        result.push({
          openid,
          nickName: typeof name === "string" && name.trim() ? name : "微信好友",
          avatarUrl: typeof (item == null ? void 0 : item.avatarUrl) === "string" ? item.avatarUrl : ""
        });
      }
      return result;
    }
    shareToFriend(openid) {
      if (typeof wx === "undefined") {
        return;
      }
      const query = "room_id=" + encodeURIComponent(String(this._shareConfig.roomId)) + "&room_name=" + encodeURIComponent(this._shareConfig.roomName) + "&invite_openid=" + encodeURIComponent(openid);
      const payload = {
        title: this._shareConfig.shareTxt,
        imageUrl: this._shareConfig.shareImageUrl,
        query
      };
      const wxApi = wx;
      if (wxApi.shareMessageToFriend) {
        wxApi.shareMessageToFriend(Object.assign({ openId: openid }, payload));
      } else if (wxApi.shareAppMessage) {
        wxApi.shareAppMessage(Object.assign({ imageUrlId: this._shareConfig.shareImageUrlId }, payload));
      }
    }
  };
  __name(_InviteOpenDataModule, "InviteOpenDataModule");
  var InviteOpenDataModule = _InviteOpenDataModule;

  // src/Main.ts
  var DESIGN_WIDTH = 720;
  var DESIGN_HEIGHT = 480;
  Laya.init(DESIGN_WIDTH, DESIGN_HEIGHT);
  Laya.stage.scaleMode = Laya.Stage.SCALE_SHOWALL;
  Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
  Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
  const inviteModule = new InviteOpenDataModule(Laya.stage);
  if (typeof wx !== "undefined" && wx.onMessage) {
    const engineHandler = Laya.MiniAdpter && Laya.MiniAdpter._onMessage;
    wx.onMessage((data) => {
      if (typeof engineHandler === "function") {
        engineHandler(data);
      }
      inviteModule.handleMessage(
        data && typeof data.type === "string" ? data : { type: "" }
      );
    });
  }
  Laya.stage.on(Laya.Event.RESIZE, inviteModule, inviteModule.onStageResize);
})();
