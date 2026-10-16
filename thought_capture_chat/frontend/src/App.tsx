import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { Message, User } from "./types";
import { MessageBubble } from "./components/MessageBubble";

const cacheKey = "thought_capture_chats";
const characters: User[] = [
  { id: "c3c73676-5431-4f3b-b3d6-d6b8cbafdee8", name: "Inner voice" },
  { id: "522e7309-9166-4f64-9d40-8d03505ebb70", name: "Self" },
];

function readMessages(): Message[] {
  try {
    const saved = localStorage.getItem(cacheKey);
    return saved ? (JSON.parse(saved) as Message[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(readMessages);
  const [currentSpeaker, setCurrentSpeaker] = useState(characters[0].id);
  const [draft, setDraft] = useState("");
  const [mobileSpeakersOpen, setMobileSpeakersOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const speaker = characters.find((character) => character.id === currentSpeaker) ?? characters[0];

  useEffect(() => {
    localStorage.setItem(cacheKey, JSON.stringify(messages));
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setMessages((previous) => [...previous, { user_id: currentSpeaker, content }]);
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Conversation settings">
        <a className="brand" href="#home" aria-label="Thoughtspace home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4.5c-5.5 0-9.5 3.8-9.5 9 0 2.8 1.2 4.8 3.2 6.4V25l5-2.4h1.4c5.7 0 9.4-3.5 9.4-8.4S21.6 4.5 16 4.5Z"/><path d="M12 14.5c1.1-2.8 2.7-4.2 4.8-4.2M15 17.7c2.1-.2 3.8-1 5.1-2.4"/></svg></span>
          <span>thoughtspace</span>
        </a>
        <div className="sidebar-section">
          <p className="section-label">YOUR VOICES</p>
          <div className="speaker-list">
            {characters.map((character, index) => (
              <button key={character.id} className={`speaker-option ${currentSpeaker === character.id ? "selected" : ""}`} onClick={() => setCurrentSpeaker(character.id)} aria-pressed={currentSpeaker === character.id}>
                <span className={`avatar avatar-${index}`} aria-hidden="true">{index === 0 ? "✳" : "Y"}</span>
                <span>{character.name}</span>
                {currentSpeaker === character.id && <span className="active-dot" aria-label="selected" />}
              </button>
            ))}
          </div>
          <p className="sidebar-hint">Choose who’s speaking. Switch voices whenever a thought takes a turn.</p>
        </div>
        <div className="sidebar-note"><span className="note-icon">✦</span><p><strong>A space for unfinished thoughts.</strong><br />No audience, no pressure. Just get it out.</p></div>
        <div className="privacy-note"><span className="privacy-dot" /> Saved on this device</div>
      </aside>

      <section className="conversation" id="home">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4.5c-5.5 0-9.5 3.8-9.5 9 0 2.8 1.2 4.8 3.2 6.4V25l5-2.4h1.4c5.7 0 9.4-3.5 9.4-8.4S21.6 4.5 16 4.5Z"/><path d="M12 14.5c1.1-2.8 2.7-4.2 4.8-4.2M15 17.7c2.1-.2 3.8-1 5.1-2.4"/></svg></span>thoughtspace</div>
          <div className="conversation-title"><span className="status-mark" /> <span>Untitled thought</span></div>
          <button className="mobile-speaker-toggle" onClick={() => setMobileSpeakersOpen((open) => !open)} aria-expanded={mobileSpeakersOpen} aria-label="Choose speaker"><span className={`avatar ${currentSpeaker === characters[1].id ? "avatar-1" : "avatar-0"}`}>{currentSpeaker === characters[1].id ? "Y" : "✳"}</span><span className="chevron">⌄</span></button>
        </header>
        {mobileSpeakersOpen && <div className="mobile-speaker-menu">{characters.map((character, index) => <button key={character.id} className={currentSpeaker === character.id ? "selected" : ""} onClick={() => { setCurrentSpeaker(character.id); setMobileSpeakersOpen(false); }}><span className={`avatar avatar-${index}`}>{index === 0 ? "✳" : "Y"}</span>{character.name}</button>)}</div>}

        <div className="chat-scroll" ref={chatRef} aria-live="polite">
          <div className="chat-content">
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="welcome-sparkle" aria-hidden="true">✳</div>
                <p className="eyebrow">A LITTLE ROOM TO THINK</p>
                <h1>Where should we<br className="desktop-break" /> start?</h1>
                <p className="welcome-copy">A passing thought, a half-formed idea, a conversation you want to hear out loud. It can start anywhere.</p>
                <div className="prompt-row"><span>“Something’s been on my mind…”</span><span>“Let me think this through”</span><span>“A scene I don’t want to forget”</span></div>
              </div>
            ) : (
              <>
                <div className="day-divider"><span /><small>YOUR THOUGHTS</small><span /></div>
                <div className="message-list">
                  {messages.map((message, index) => {
                    const person = characters.find((character) => character.id === message.user_id);
                    if (!person) return null;
                    return <MessageBubble key={`${index}-${message.user_id}`} name={person.name} side={person.name === "Self" ? "end" : "start"} content={message.content} />;
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="composer-wrap">
          <form className="composer" onSubmit={sendMessage}>
            <div className="composer-context"><span className={`avatar composer-avatar ${speaker.name === "Self" ? "avatar-1" : "avatar-0"}`}>{speaker.name === "Self" ? "Y" : "✳"}</span><span>Speaking as <strong>{speaker.name}</strong></span></div>
            <div className="composer-input-row">
              <textarea ref={textareaRef} value={draft} onChange={(event) => handleDraftChange(event.target.value)} onKeyDown={handleKeyDown} placeholder="Let your thoughts wander…" rows={1} aria-label="Write a thought" />
              <button className="send-button" type="submit" disabled={!draft.trim()} aria-label="Send thought"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg></button>
            </div>
            <div className="composer-foot"><span><kbd>↵</kbd> to send <span className="foot-separator">·</span> <kbd>shift ↵</kbd> for a new line</span><span className="gentle-reminder">Take your time <span>✦</span></span></div>
          </form>
          <p className="local-caption">Your conversation stays in this browser.</p>
        </footer>
      </section>
    </main>
  );
}
