interface BubblePropsType {
  content: string;
  name: string;
  side: "start" | "end";
}

export function MessageBubble({ content, name, side }: BubblePropsType) {
  return (
    <article className={`message-row ${side === "end" ? "message-row-end" : "message-row-start"}`}>
      <div className={`message-bubble ${side === "start" ? "received" : "sent"}`}>
        <span className="message-name-tag">{name}</span>
        <p className="message-content">{content}</p>
      </div>
    </article>
  );
}
