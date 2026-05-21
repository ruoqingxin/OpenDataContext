import OpenDataApp from "./opendata/OpenDataApp";
import WxOpenDataBridge from "./opendata/WxOpenDataBridge";
const { regClass, property } = Laya;
let Main = class Main extends Laya.Script {
    constructor() {
        super(...arguments);
        this._openDataApp = null;
    }
    onAwake() {
        if (Laya.Browser.onMiniGame) {
            this._openDataApp = new OpenDataApp(Laya.stage, new WxOpenDataBridge());
            this._openDataApp.start();
        }
    }
};
Main = __decorate([
    regClass()
], Main);
export default Main;
