import { useRef, useState } from "react";

interface BubblePropsType {
  content: string;
  name: string;
  side: "start" | "end";
  onEdit: (content: string) => void;
  onDelete: () => void;
}

function Icon({ type }: { type: "edit" | "delete" }) {
  return type === "delete"
    ? <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5.5h13M8 5.5V3.5h4v2M6 5.5l.8 11h6.4l.8-11M8.5 8.5v5M11.5 8.5v5" /></svg>
    : <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 13.5-.8 3.3 3.3-.8L16 6.5 13.5 4 4 13.5ZM12.5 5l2.5 2.5" /></svg>;
}

export function MessageBubble({ content, name, side, onEdit, onDelete }: BubblePropsType) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHold = useRef(false);

  const startHold = () => {
    didHold.current = false;
    holdTimer.current = setTimeout(() => { didHold.current = true; setActionsOpen(true); }, 500);
  };
  const endHold = () => { if (holdTimer.current) clearTimeout(holdTimer.current); };
  const save = () => {
    const value = draft.trim();
    if (value) onEdit(value);
    else setDraft(content);
    setEditing(false);
    setActionsOpen(false);
  };

  return (
    <article className={`message-row ${side === "end" ? "message-row-end" : "message-row-start"} ${actionsOpen ? "message-actions-open" : ""}`} onTouchStart={startHold} onTouchEnd={endHold} onTouchMove={endHold} onContextMenu={(event) => { event.preventDefault(); setActionsOpen(true); }}>
      <div className={`message-bubble ${side === "start" ? "received" : "sent"}`}>
        <span className="message-name-tag">{name}</span>
        {editing ? <textarea className="message-edit-input" value={draft} onChange={(event) => setDraft(event.target.value)} aria-label={`Edit message from ${name}`} autoFocus /> : <p className="message-content">{content}</p>}
        <div className="message-actions" aria-label="Message actions">
          {editing ? <button className="icon-action" onClick={save} aria-label="Save message" title="Save"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg></button> : <button className="icon-action" onClick={() => { setDraft(content); setEditing(true); setActionsOpen(true); }} aria-label="Edit message" title="Edit"><Icon type="edit" /></button>}
          <button className="icon-action" onClick={onDelete} aria-label="Delete message" title="Delete"><Icon type="delete" /></button>
        </div>
      </div>
    </article>
  );
}
