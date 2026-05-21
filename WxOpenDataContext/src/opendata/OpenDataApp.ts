import InviteOpenDataModule from "./InviteOpenDataModule";
import { OpenDataBridge } from "./types";

export default class OpenDataApp {
    private _inviteModule: InviteOpenDataModule;
    private _started: boolean = false;

    constructor(private _stage: Laya.Stage, private _bridge: OpenDataBridge) {
        this._inviteModule = new InviteOpenDataModule(this._stage, this._bridge);
    }

    public start(): void {
        if (this._started) {
            return;
        }
        this._started = true;
        this._bridge.onMessage(this._inviteModule.handleMessage.bind(this._inviteModule));
        this._stage.on(Laya.Event.RESIZE, this._inviteModule, this._inviteModule.onStageResize);
    }
}
