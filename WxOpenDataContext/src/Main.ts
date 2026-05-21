import { OPEN_DATA_ASSETS } from "./opendata/OpenDataAssets";
import InviteOpenDataModule from "./opendata/InviteOpenDataModule";
import { OpenDataMessage } from "./opendata/types";

const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 1280;

function preloadAssets(): Promise<void> {
    const tasks = OPEN_DATA_ASSETS.map((url) => {
        const task: any = Laya.loader.load(url);
        if (task && typeof task.then === "function") {
            return task;
        }
        return new Promise<void>((resolve) => {
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

preloadAssets()
    .catch((err) => console.error("[OpenData] 资源预加载失败:", err))
    .then(() => {
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
    });
