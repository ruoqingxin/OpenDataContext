(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/opendata/OpenDataAssets.ts
  var OPEN_DATA_IMAGES = {
    itemBg: "image/ui_frame_qswj_d.png",
    inviteBtn: "image/ui_btn_ty_g2.png",
    defaultAvatar: "image/icon_800000.png"
  };
  var OPEN_DATA_ASSETS = Object.values(OPEN_DATA_IMAGES);

  // src/opendata/types.ts
  var OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend",
    UpdateViewPort: "updateViewPort",
    Close: "close"
  };

  // src/opendata/UISocialInviteView.ts
  var DESIGN_W = 720;
  var DESIGN_H = 1280;
  var LIST = { x: 16, y: 91, width: 696, height: 1047, bottom: 142 };
  var ITEM = { width: 688, height: 200, rowGap: -15 };
  var ITEM_STEP = ITEM.height + ITEM.rowGap;
  var ITEM_BG = { y: 28, width: 688, height: 172 };
  var ITEM_HEAD = { x: 38, y: 64, size: 100 };
  var ITEM_NICK = { x: 162, y: 95, width: 270, height: 37, fontSize: 32, color: "#8a5839", strokeColor: "#373899" };
  var ITEM_BTN = { cx: 582, cy: 114, width: 161, height: 64 };
  var ITEM_BTN_TEXT = { fontSize: 32, color: "#f8fde4", stroke: 4, strokeColor: "#4d7b26" };
  var _UISocialInviteView = class _UISocialInviteView extends Laya.Sprite {
    constructor(_onInvite) {
      super();
      this._onInvite = _onInvite;
      this._listPanel = new Laya.Panel();
      this._emptyLabel = new Laya.Label();
      this._scaleX = 1;
      this._scaleY = 1;
      this._itemWidth = ITEM.width;
      this._listPanel.vScrollBarSkin = "";
      this.addChild(this._listPanel);
      this._emptyLabel.text = "暂无可邀请的微信好友";
      this._emptyLabel.fontSize = 24;
      this._emptyLabel.color = "#999999";
      this._emptyLabel.align = "center";
      this._emptyLabel.valign = "middle";
      this._emptyLabel.visible = false;
      this.addChild(this._emptyLabel);
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
      this._scaleX = w / DESIGN_W;
      this._scaleY = h / DESIGN_H;
      this._itemWidth = ITEM.width * this._scaleX;
      const listX = LIST.x * this._scaleX;
      const listY = LIST.y * this._scaleY;
      const listW = w - listX * 2;
      const listH = h - listY - LIST.bottom * this._scaleY;
      this._listPanel.pos(listX, listY);
      this._listPanel.size(listW, listH);
      this._emptyLabel.pos(listX, listY);
      this._emptyLabel.size(listW, listH);
    }
    createItem(user, index) {
      const sx = this._scaleX;
      const sy = this._scaleY;
      const itemH = ITEM.height * sy;
      const itemW = this._itemWidth;
      const item = new Laya.Box();
      item.size(itemW, itemH);
      item.y = index * ITEM_STEP * sy;
      const bg = new Laya.Image();
      bg.skin = OPEN_DATA_IMAGES.itemBg;
      bg.pos(0, ITEM_BG.y * sy);
      bg.size(ITEM_BG.width * sx, ITEM_BG.height * sy);
      item.addChild(bg);
      const imgHead = new Laya.Image();
      imgHead.pos(ITEM_HEAD.x * sx, ITEM_HEAD.y * sy);
      imgHead.size(ITEM_HEAD.size * sx, ITEM_HEAD.size * sy);
      imgHead.skin = user.avatarUrl || OPEN_DATA_IMAGES.defaultAvatar;
      item.addChild(imgHead);
      const txtNick = new Laya.Label();
      txtNick.text = user.nickName || "玩家昵称";
      txtNick.fontSize = ITEM_NICK.fontSize * sy;
      txtNick.color = ITEM_NICK.color;
      txtNick.strokeColor = ITEM_NICK.strokeColor;
      txtNick.stroke = 1;
      txtNick.valign = "middle";
      txtNick.pos(ITEM_NICK.x * sx, ITEM_NICK.y * sy);
      txtNick.size(ITEM_NICK.width * sx, ITEM_NICK.height * sy);
      txtNick.overflow = "hidden";
      item.addChild(txtNick);
      const btnW = ITEM_BTN.width * sx;
      const btnH = ITEM_BTN.height * sy;
      const btnX = ITEM_BTN.cx * sx - btnW * 0.5;
      const btnY = ITEM_BTN.cy * sy - btnH * 0.5;
      const btnInvite = new Laya.Image();
      btnInvite.skin = OPEN_DATA_IMAGES.inviteBtn;
      btnInvite.pos(btnX, btnY);
      btnInvite.size(btnW, btnH);
      btnInvite.mouseEnabled = true;
      btnInvite.on(Laya.Event.CLICK, this, () => this._onInvite(user.openid));
      item.addChild(btnInvite);
      const txtTitle = new Laya.Label();
      txtTitle.text = "邀请";
      txtTitle.fontSize = ITEM_BTN_TEXT.fontSize * sy;
      txtTitle.color = ITEM_BTN_TEXT.color;
      txtTitle.stroke = ITEM_BTN_TEXT.stroke;
      txtTitle.strokeColor = ITEM_BTN_TEXT.strokeColor;
      txtTitle.align = "center";
      txtTitle.valign = "middle";
      txtTitle.size(btnW, btnH);
      txtTitle.pos(btnX, btnY);
      txtTitle.mouseEnabled = false;
      item.addChild(txtTitle);
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
          if (!box) break;
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
      if (!this._inviteView) return;
      this._inviteView.size(this._stage.width, this._stage.height);
      this._inviteView.layout();
    }
    showView() {
      if (!this._inviteView) {
        this._inviteView = new UISocialInviteView((openid) => this.shareToFriend(openid));
      }
      this._inviteView.size(this._stage.width, this._stage.height);
      this._inviteView.setUsers(this._users);
      if (!this._inviteView.parent) this._stage.addChild(this._inviteView);
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
      if (this._loadingFriends || this._loadedFriends || typeof wx === "undefined" || !wx.getFriendCloudStorage) return;
      this._loadingFriends = true;
      wx.getFriendCloudStorage({
        keyList: ["invite_tag"],
        success: (res) => {
          this._users = this.mapFriends(Array.isArray(res == null ? void 0 : res.data) ? res.data : []);
          this._loadedFriends = true;
          this.refreshView();
        },
        complete: () => { this._loadingFriends = false; }
      });
    }
    mapFriends(list) {
      const result = [];
      const seen = /* @__PURE__ */ new Set();
      for (const item of list) {
        const openid = typeof (item == null ? void 0 : item.openid) === "string" ? item.openid.trim() : "";
        if (!openid || seen.has(openid)) continue;
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
      if (typeof wx === "undefined") return;
      const query = "room_id=" + encodeURIComponent(String(this._shareConfig.roomId)) + "&room_name=" + encodeURIComponent(this._shareConfig.roomName) + "&invite_openid=" + encodeURIComponent(openid);
      const payload = { title: this._shareConfig.shareTxt, imageUrl: this._shareConfig.shareImageUrl, query };
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
  var DESIGN_HEIGHT = 1280;
  function preloadAssets() {
    const tasks = OPEN_DATA_ASSETS.map((url) => {
      const task = Laya.loader.load(url);
      if (task && typeof task.then === "function") return task;
      return new Promise((resolve) => {
        Laya.loader.load(url, Laya.Handler.create(null, () => resolve()));
      });
    });
    return Promise.all(tasks).then(() => void 0);
  }
  Laya.init(DESIGN_WIDTH, DESIGN_HEIGHT);
  Laya.stage.scaleMode = Laya.Stage.SCALE_SHOWALL;
  Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
  Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
  const inviteModule = new InviteOpenDataModule(Laya.stage);
  preloadAssets().catch((err) => console.error("[OpenData] 资源预加载失败:", err)).then(() => {
    if (typeof wx !== "undefined" && wx.onMessage) {
      const engineHandler = Laya.MiniAdpter && Laya.MiniAdpter._onMessage;
      wx.onMessage((data) => {
        if (typeof engineHandler === "function") engineHandler(data);
        inviteModule.handleMessage(data && typeof data.type === "string" ? data : { type: "" });
      });
    }
    Laya.stage.on(Laya.Event.RESIZE, inviteModule, inviteModule.onStageResize);
  });
})();
