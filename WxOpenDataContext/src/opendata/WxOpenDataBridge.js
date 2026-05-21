export default class WxOpenDataBridge {
    onMessage(handler) {
        const wxApi = wx;
        if (!(wxApi === null || wxApi === void 0 ? void 0 : wxApi.onMessage)) {
            return;
        }
        wxApi.onMessage((data) => {
            const message = data && typeof data.type === "string" ? data : { type: "" };
            handler(message);
        });
    }
}
