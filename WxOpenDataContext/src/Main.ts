import { OPEN_DATA_ASSETS } from "./opendata/OpenDataAssets";
import InviteOpenDataModule from "./opendata/InviteOpenDataModule";
import { OpenDataMessage } from "./opendata/types";

const { regClass } = Laya;

const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 1280;

let _started = false;

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

function startOpenData(): void {
    if (_started) {
        return;
    }
    _started = true;

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
}

/** 挂载到 Scene，供 Laya 构建分析依赖；开放域实际由下方 startOpenData() 启动 */
@regClass()
export default class Main extends Laya.Script {
    onAwake(): void {
        startOpenData();
    }
}

// 开放域 index.js 只加载 bundle.js，不会 Scene.open，需模块加载时即启动
startOpenData();
