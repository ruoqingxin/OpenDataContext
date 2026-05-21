import InviteOpenDataModule from "./opendata/InviteOpenDataModule";
import { OpenDataMessage } from "./opendata/types";

const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 480;

Laya.init(DESIGN_WIDTH, DESIGN_HEIGHT);
Laya.stage.scaleMode = Laya.Stage.SCALE_SHOWALL;
Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;

const inviteModule = new InviteOpenDataModule(Laya.stage);

if (typeof wx !== "undefined" && wx.onMessage) {
    const engineHandler = (Laya as typeof Laya & { MiniAdpter?: { _onMessage?: (data: Record<string, unknown>) => void } })
        .MiniAdpter?._onMessage;

    wx.onMessage((data: Record<string, unknown>) => {
        if (typeof engineHandler === "function") {
            engineHandler(data);
        }
        inviteModule.handleMessage(
            data && typeof data.type === "string" ? (data as OpenDataMessage) : { type: "" }
        );
    });
}

Laya.stage.on(Laya.Event.RESIZE, inviteModule, inviteModule.onStageResize);
