import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { Chat, Message, User, Workspace } from "./types";
import { MessageBubble } from "./components/MessageBubble";

const storageKey = "thought_capture_workspace_v2";
const legacyKey = "thought_capture_chats";
const themeKey = "thought_capture_theme";
const defaultSpeakers: User[] = [
  { id: "c3c73676-5431-4f3b-b3d6-d6b8cbafdee8", name: "Inner voice" },
  { id: "522e7309-9166-4f64-9d40-8d03505ebb70", name: "Self" },
];

function makeChat(name = "Untitled thought"): Chat {
  return { id: crypto.randomUUID(), name, messages: [] };
}

function readWorkspace(): Workspace {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const workspace = JSON.parse(saved) as Workspace;
      if (Array.isArray(workspace.chats) && Array.isArray(workspace.speakers)) return workspace;
    }
    const legacy = localStorage.getItem(legacyKey);
    const oldMessages = legacy ? (JSON.parse(legacy) as Message[]) : [];
    const firstChat: Chat = { id: "legacy-chat", name: "Untitled thought", messages: oldMessages };
    return { chats: [firstChat], activeChatId: firstChat.id, speakers: defaultSpeakers, currentSpeakerId: defaultSpeakers[0].id };
  } catch {
    const firstChat = makeChat();
    return { chats: [firstChat], activeChatId: firstChat.id, speakers: defaultSpeakers, currentSpeakerId: defaultSpeakers[0].id };
  }
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(readWorkspace);
  const [theme, setTheme] = useState<"light" | "dark">(() => localStorage.getItem(themeKey) === "dark" ? "dark" : "light");
  const [draft, setDraft] = useState("");
  const [mobileSpeakersOpen, setMobileSpeakersOpen] = useState(false);
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [speakerNameDraft, setSpeakerNameDraft] = useState("");
  const [renamingChat, setRenamingChat] = useState(false);
  const [chatNameDraft, setChatNameDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatNameRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const activeChat = workspace.chats.find((chat) => chat.id === workspace.activeChatId) ?? workspace.chats[0];
  const messages = activeChat?.messages ?? [];
  const speakers = workspace.speakers;
  const currentSpeakerId = workspace.currentSpeakerId;
  const speaker = speakers.find((character) => character.id === currentSpeakerId) ?? speakers[0];

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(workspace));
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [workspace]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");

  useEffect(() => {
    if (renamingChat) chatNameRef.current?.focus();
  }, [renamingChat]);

  const updateActiveChat = (update: (chat: Chat) => Chat) => {
    setWorkspace((previous) => ({
      ...previous,
      chats: previous.chats.map((chat) => chat.id === previous.activeChatId ? update(chat) : chat),
    }));
  };

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || !activeChat) return;
    updateActiveChat((chat) => ({ ...chat, messages: [...chat.messages, { user_id: currentSpeakerId, content }] }));
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

  const createChat = () => {
    const chat = makeChat();
    setWorkspace((previous) => ({ ...previous, chats: [...previous.chats, chat], activeChatId: chat.id }));
    setDraft("");
    setChatNameDraft(chat.name);
    setRenamingChat(true);
    setMobileSpeakersOpen(false);
    setMobileChatsOpen(false);
  };

  const renameChat = () => {
    const name = chatNameDraft.trim();
    if (name) updateActiveChat((chat) => ({ ...chat, name }));
    setRenamingChat(false);
  };

  const beginSpeakerRename = (character: User) => {
    setEditingSpeakerId(character.id);
    setSpeakerNameDraft(character.name);
  };

  const saveSpeakerName = () => {
    const name = speakerNameDraft.trim();
    if (name && editingSpeakerId) {
      setWorkspace((previous) => ({ ...previous, speakers: previous.speakers.map((character) => character.id === editingSpeakerId ? { ...character, name } : character) }));
    }
    setEditingSpeakerId(null);
  };

  const selectSpeaker = (id: string) => setWorkspace((previous) => ({ ...previous, currentSpeakerId: id }));

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Chats and conversation settings">
        <a className="brand" href="#home" aria-label="Thoughtspace home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4.5c-5.5 0-9.5 3.8-9.5 9 0 2.8 1.2 4.8 3.2 6.4V25l5-2.4h1.4c5.7 0 9.4-3.5 9.4-8.4S21.6 4.5 16 4.5Z"/><path d="M12 14.5c1.1-2.8 2.7-4.2 4.8-4.2M15 17.7c2.1-.2 3.8-1 5.1-2.4"/></svg></span>
          <span>thoughtspace</span>
        </a>

        <button className="new-chat-button" onClick={createChat}><span aria-hidden="true">＋</span> New chat</button>
        <div className="chat-library">
          <p className="section-label">YOUR CHATS <span>{workspace.chats.length}</span></p>
          <div className="chat-list">
            {workspace.chats.map((chat) => (
              <button key={chat.id} className={`chat-option ${activeChat?.id === chat.id ? "selected" : ""}`} onClick={() => { setWorkspace((previous) => ({ ...previous, activeChatId: chat.id })); setDraft(""); setRenamingChat(false); }} aria-current={activeChat?.id === chat.id ? "page" : undefined}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4.5h12v9H9l-4 2v-11Z" /></svg>
                <span>{chat.name || "Untitled thought"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-label">YOUR VOICES</p>
          <div className="speaker-list">
            {speakers.map((character, index) => (
              <div key={character.id} className={`speaker-option ${currentSpeakerId === character.id ? "selected" : ""}`}>
                {editingSpeakerId === character.id ? <>
                  <span className={`avatar avatar-${index}`} aria-hidden="true">{index === 0 ? "✳" : "Y"}</span>
                  <input className="inline-name-input speaker-name-input" value={speakerNameDraft} onChange={(event) => setSpeakerNameDraft(event.target.value)} onBlur={saveSpeakerName} onKeyDown={(event) => { if (event.key === "Enter") saveSpeakerName(); if (event.key === "Escape") setEditingSpeakerId(null); }} aria-label={`Rename ${character.name}`} maxLength={32} />
                </> : <button className="speaker-select-button" onClick={() => selectSpeaker(character.id)} aria-pressed={currentSpeakerId === character.id}>
                  <span className={`avatar avatar-${index}`} aria-hidden="true">{index === 0 ? "✳" : "Y"}</span>
                  <span className="speaker-name-button">{character.name}</span>
                  {currentSpeakerId === character.id && <span className="active-dot" aria-label="selected" />}
                </button>}
                <button className="edit-name-button" onClick={() => beginSpeakerRename(character)} aria-label={`Edit ${character.name} name`} title="Rename">✎</button>
              </div>
            ))}
          </div>
          <p className="sidebar-hint">Choose who’s speaking. Switch voices whenever a thought takes a turn.</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} aria-pressed={theme === "dark"}>
          <span className="theme-icon" aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span><span>{theme === "light" ? "Dark theme" : "Light theme"}</span><span className={`theme-switch ${theme === "dark" ? "on" : ""}`}><span /></span>
        </button>
        <div className="sidebar-note"><span className="note-icon">✦</span><p><strong>A space for unfinished thoughts.</strong><br />No audience, no pressure. Just get it out.</p></div>
        <div className="privacy-note"><span className="privacy-dot" /> Saved on this device</div>
      </aside>

      <section className="conversation" id="home">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4.5c-5.5 0-9.5 3.8-9.5 9 0 2.8 1.2 4.8 3.2 6.4V25l5-2.4h1.4c5.7 0 9.4-3.5 9.4-8.4S21.6 4.5 16 4.5Z"/><path d="M12 14.5c1.1-2.8 2.7-4.2 4.8-4.2M15 17.7c2.1-.2 3.8-1 5.1-2.4"/></svg></span>thoughtspace</div>
          <button className="mobile-library-toggle" onClick={() => { setMobileChatsOpen((open) => !open); setMobileSpeakersOpen(false); }} aria-label="Open chats" aria-expanded={mobileChatsOpen}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" /></svg></button>
          <div className="conversation-title">
            <span className="status-mark" />
            {renamingChat ? <input ref={chatNameRef} className="inline-name-input chat-title-input" value={chatNameDraft} onChange={(event) => setChatNameDraft(event.target.value)} onBlur={renameChat} onKeyDown={(event) => { if (event.key === "Enter") renameChat(); if (event.key === "Escape") setRenamingChat(false); }} maxLength={48} aria-label="Chat name" /> : <button className="chat-title-button" onClick={() => { setChatNameDraft(activeChat?.name ?? "Untitled thought"); setRenamingChat(true); }} title="Click to rename this chat">{activeChat?.name ?? "Untitled thought"}<span className="title-edit-icon">✎</span></button>}
          </div>
          <button className="mobile-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} title={theme === "light" ? "Dark theme" : "Light theme"}>{theme === "light" ? "☾" : "☀"}</button>
          <button className="mobile-speaker-toggle" onClick={() => setMobileSpeakersOpen((open) => !open)} aria-expanded={mobileSpeakersOpen} aria-label="Choose speaker"><span className={`avatar ${speaker?.id === speakers[1]?.id ? "avatar-1" : "avatar-0"}`}>{speaker?.id === speakers[1]?.id ? "Y" : "✳"}</span><span className="chevron">⌄</span></button>
        </header>
        {mobileChatsOpen && <div className="mobile-chat-menu"><button className="mobile-new-chat" onClick={createChat}>＋ New chat</button>{workspace.chats.map((chat) => <button key={chat.id} className={activeChat?.id === chat.id ? "selected" : ""} onClick={() => { setWorkspace((previous) => ({ ...previous, activeChatId: chat.id })); setDraft(""); setRenamingChat(false); setMobileChatsOpen(false); }}><span>{chat.name || "Untitled thought"}</span><small>{chat.messages.length}</small></button>)}</div>}
        {mobileSpeakersOpen && <div className="mobile-speaker-menu">{speakers.map((character, index) => <button key={character.id} className={currentSpeakerId === character.id ? "selected" : ""} onClick={() => { selectSpeaker(character.id); setMobileSpeakersOpen(false); }}><span className={`avatar avatar-${index}`}>{index === 0 ? "✳" : "Y"}</span>{character.name}<span className="mobile-rename" onClick={(event) => { event.stopPropagation(); beginSpeakerRename(character); setMobileSpeakersOpen(false); }}>✎</span></button>)}</div>}

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
                    const person = speakers.find((character) => character.id === message.user_id);
                    if (!person) return null;
                    return <MessageBubble key={`${index}-${message.user_id}`} name={person.name} side={person.id === speakers[1]?.id ? "end" : "start"} content={message.content} />;
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="composer-wrap">
          <form className="composer" onSubmit={sendMessage}>
            <div className="composer-context"><span className={`avatar composer-avatar ${speaker?.id === speakers[1]?.id ? "avatar-1" : "avatar-0"}`}>{speaker?.id === speakers[1]?.id ? "Y" : "✳"}</span><span>Speaking as <strong>{speaker?.name}</strong></span></div>
            <div className="composer-input-row">
              <textarea ref={textareaRef} value={draft} onChange={(event) => handleDraftChange(event.target.value)} onKeyDown={handleKeyDown} placeholder="Let your thoughts wander…" rows={1} aria-label="Write a thought" />
              <button className="send-button" type="submit" disabled={!draft.trim()} aria-label="Send thought"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg></button>
            </div>
            <div className="composer-foot"><span><kbd>↵</kbd> to send <span className="foot-separator">·</span> <kbd>shift ↵</kbd> for a new line</span><span className="gentle-reminder">Take your time <span>✦</span></span></div>
          </form>
          <p className="local-caption">Your conversations stay in this browser.</p>
        </footer>
      </section>
    </main>
  );
}
