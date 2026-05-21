import InviteOpenDataModule from "./InviteOpenDataModule";
export default class OpenDataApp {
    constructor(_stage, _bridge) {
        this._stage = _stage;
        this._bridge = _bridge;
        this._started = false;
        this._inviteModule = new InviteOpenDataModule(this._stage, this._bridge);
    }
    start() {
        if (this._started) {
            return;
        }
        this._started = true;
        this._bridge.onMessage(this._inviteModule.handleMessage.bind(this._inviteModule));
        this._stage.on(Laya.Event.RESIZE, this._inviteModule, this._inviteModule.onStageResize);
    }
}
