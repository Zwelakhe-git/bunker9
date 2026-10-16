export interface Message{
    user_id: string,
    content: string
}

export interface User {
    id: string,
    name: string
}

export interface Chat {
    id: string,
    name: string,
    messages: Message[]
}

export interface Workspace {
    chats: Chat[],
    activeChatId: string,
    speakers: User[],
    currentSpeakerId: string
}
