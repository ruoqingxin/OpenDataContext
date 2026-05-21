import { OPEN_DATA_ASSETS } from "./opendata/OpenDataAssets";
import OpenDataApp from "./opendata/OpenDataApp";
import WxOpenDataBridge from "./opendata/WxOpenDataBridge";

const { regClass } = Laya;

@regClass()
export default class Main extends Laya.Script {
    private _openDataApp: OpenDataApp | null = null;

    onAwake(): void {
        this.preloadOpenDataAssets()
            .catch((err) => console.error("[OpenData] 资源预加载失败:", err))
            .then(() => this.startOpenDataApp());
    }

    private startOpenDataApp(): void {
        this._openDataApp = new OpenDataApp(Laya.stage, new WxOpenDataBridge());
        this._openDataApp.start();
    }

    private preloadOpenDataAssets(): Promise<void> {
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
}
