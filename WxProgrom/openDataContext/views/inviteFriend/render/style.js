/**
 * Layout 样式 — 由 assets/prefab/UISocialInviteView.lh 转换
 * 标记 @prefab-sync-start … @prefab-sync-end 区块供 sync-prefab-layout.js 覆盖，请勿手改。
 */
// @prefab-sync-start
module.exports = {
  container: {
    width: 535,
    height: 779,
    position: "relative",
  },
  list_items: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 535,
    height: 779,
    flexDirection: "column",
    scrollY: true,
  },
  item: {
    width: 535,
    height: 135,
    position: "relative",
    flexShrink: 0,
  },
  img_bg: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 535,
    height: 134,
  },
  img_head: {
    position: "absolute",
    left: 42,
    top: 25,
    width: 80,
    height: 80,
  },
  txt_nick: {
    position: "absolute",
    left: 144,
    top: 49,
    width: 270,
    height: 37,
    fontSize: 32,
    color: "#8a5839",
    verticalAlign: "middle",
    textStrokeColor: "#373899",
    textStrokeWidth: 1,
  },
  btn_invite: {
    position: "absolute",
    left: 345.5,
    top: 35,
    width: 161,
    height: 64,
  },
  txt_title: {
    position: "absolute",
    left: 351.5,
    top: 44,
    width: 149,
    height: 46,
    fontSize: 30,
    color: "#f8fde4",
    verticalAlign: "middle",
    textAlign: "center",
    textStrokeWidth: 4,
    textStrokeColor: "#4d7b26",
    paddingTop: 11,
    paddingRight: 2,
    paddingBottom: 2,
    paddingLeft: 2,
  },
  emptyText: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 535,
    height: 779,
    fontSize: 24,
    color: "#999999",
    textAlign: "center",
    verticalAlign: "middle",
  }
};
// @prefab-sync-end
