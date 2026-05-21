import OpenDataApp from "./opendata/OpenDataApp";
import WxOpenDataBridge from "./opendata/WxOpenDataBridge";

const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 480;

Laya.init(DESIGN_WIDTH, DESIGN_HEIGHT);
Laya.stage.scaleMode = Laya.Stage.SCALE_SHOWALL;
Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;

const openDataApp = new OpenDataApp(Laya.stage, new WxOpenDataBridge());
openDataApp.start();
