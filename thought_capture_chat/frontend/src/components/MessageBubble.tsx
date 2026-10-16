

interface BubblePropsType {
    content: string,
    name: string,
    side: "start" | "end"
}

export function MessageBubble(props : BubblePropsType){
    return (<div className={`d-flex justify-content-${props.side}`}>
        <div className={`message-bubble ${props.side === 'start' ? 'received' : 'sent'}`}>
            <div className={`d-flex justify-content-${props.side} bg-transparent`}>
                <div className="message-name-tag">
                    <div className="w-75 h-100 ellipsis fs-xs m-auto">{props.name}</div>
                </div>
            </div>
            <div className="message-content w-fit p-2">{props.content}</div>
        </div>
    </div>)
}