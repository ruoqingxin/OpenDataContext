export interface InviteUser {
    openid: string;
    nickName: string;
    avatarUrl: string;
}

export interface InviteViewState {
    users: InviteUser[];
}

export interface OpenDataMessage {
    type: string;
    [key: string]: unknown;
}

export interface OpenDataBridge {
    onMessage(handler: (msg: OpenDataMessage) => void): void;
}
