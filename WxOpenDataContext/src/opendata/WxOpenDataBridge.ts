import { OpenDataBridge, OpenDataMessage } from "./types";

type EngineMessageHandler = (data: Record<string, unknown>) => void;

export default class WxOpenDataBridge implements OpenDataBridge {
    public onMessage(handler: (msg: OpenDataMessage) => void): void {
        const wxApi = typeof wx !== "undefined" ? wx : null;
        if (!wxApi?.onMessage) {
            return;
        }

        const engineHandler = this.getEngineMessageHandler();
        wxApi.onMessage((data: Record<string, unknown>) => {
            if (typeof engineHandler === "function") {
                engineHandler(data);
            }

            const message: OpenDataMessage =
                data && typeof data.type === "string" ? (data as OpenDataMessage) : { type: "" };
            handler(message);
        });
    }

    private getEngineMessageHandler(): EngineMessageHandler | null {
        const laya = Laya as typeof Laya & {
            MiniAdpter?: { _onMessage?: EngineMessageHandler };
        };
        return laya.MiniAdpter?._onMessage ?? null;
    }
}
