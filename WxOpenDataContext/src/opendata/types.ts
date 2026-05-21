export interface InviteUser {
    openid: string;
    nickName: string;
    avatarUrl: string;
}

export interface OpenDataMessage {
    type: string;
    [key: string]: unknown;
}

export const OpenDataCommand = {
    ShowInviteFriend: "od:showInviteFriend",
    HideInviteFriend: "od:hideInviteFriend",
    UpdateViewPort: "updateViewPort",
    Close: "close",
} as const;
