export const OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend",
    UpdateViewPort: "updateViewPort",
    Close: "close",
} as const;

export type OpenDataCommandType = typeof OpenDataCommand[keyof typeof OpenDataCommand];
