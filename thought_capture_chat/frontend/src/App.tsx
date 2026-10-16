import { useEffect, useRef, useState } from "react";
import { apiClient } from "./api/client";
import type { Message, User } from "./types";
import arrow_up from "./assets/arrow_up.ico";
import { MessageBubble } from "./components/MessageBubble";

export default function App() {
    const [ characters, setCharacters] = useState<User[]>([]);
    const [ messages, setMessages ] = useState<Message[]>([]);
    const [ currentSpeaker, setCurrentSpeaker ] = useState<string>("");
    const [ typing, setTyping ] = useState<boolean>(false);

    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        setCharacters(() => {
            const chars = [
            {
                id: "c3c73676-5431-4f3b-b3d6-d6b8cbafdee8",
                name: "A really long name"
            },
            {
                id: "522e7309-9166-4f64-9d40-8d03505ebb70",
                name: "Self"
            }
            ];
            setCurrentSpeaker(chars[0].id);
            return chars;
        });

        
    }, []);

    useEffect(() => {
        const onKeyPress = (e: KeyboardEvent) => {
            if(e.shiftKey && e.ctrlKey){
                e.preventDefault();
                setCurrentSpeaker((uid: string) => {
                    const uIdx = characters.findIndex(u => u.id == uid);
                    return characters[(uIdx + 1) % characters.length].id;
                });
            }
        }

        window.addEventListener('keydown', onKeyPress);

        return () => {
            window.removeEventListener('keydown', onKeyPress);
        }
    }, [currentSpeaker]);

    useEffect(() => {
        if(typing){
            console.log("user is typing");
        } else {
            console.log("not typing");
        }
    }, [typing]);

    const sendMessage = () => {
        if(!currentSpeaker.length || !messageInputRef.current){
            return;
        }
    
        const msg = messageInputRef.current.value;
        if(!msg.length) return;
        setMessages((prev: Message[]) => {
            return [...prev,
                {user_id: currentSpeaker,
                content: msg}
            ]
        });
        messageInputRef.current.value = "";
    }
    return (
    <main id="artboard" className="d-flex artboard flex-row">
        <div id="left-panel" className="w-12 h-100 border-1 p-2">
            <div className="panel-title">
                <h3>Characters</h3>
            </div>
            <div id="characters-list" className="w-100 d-flex gap-2 flex-column">
                {characters.map((character, idx) => (
                    <li key={idx * (5 + Math.random() * (5))} className={`character ${currentSpeaker == character.id && 'active'}`} onClick={()=>{ setCurrentSpeaker(character.id); }}>{character.name}</li>
                ))
                }
            </div>
        </div>
        <div id="right-panel" className="w-100 h-100">
            <div className="chats-area d-flex flex-column gap-2 p-2">
                {messages.map((msg, idx) => {
                    const person = characters.find(c => c.id === msg.user_id);
                    if(!person) return null;
                    return <MessageBubble key={idx * (1024 % (idx + 2^idx))} name={person.name} side={person.name.toLowerCase() === "self" ? "end" : "start"} content={msg.content}/>;
                })}
                {typing && (
                    <MessageBubble
                    name={characters.find(c => c.id == currentSpeaker)?.name ?? "slef"}
                    side={(characters.find(c => c.id == currentSpeaker)?.name ?? "self").toLowerCase() === "self" ? "end" : "start"}
                    content="..."
                    />
                )}
            </div>
            <div id="message-area" className="container" aria-label="Layout container">
                <div id="message-box" className="rectangle bg-transparent" aria-label="Rectangle">
                    <textarea ref={messageInputRef} id="message-inp" placeholder="Message" onKeyDown={(e) => {
                        if(e.key === "Enter"){
                            if(!e.shiftKey && !e.ctrlKey){
                                e.preventDefault();
                                sendMessage();
                            } else {
                                messageInputRef.current && (messageInputRef.current.value += "\n");
                            }
                            
                        }
                    }} onChange={function(){
                        messageInputRef.current && setTyping(messageInputRef.current.value.length > 0);
                    }} onBlur={() => setTyping(false)}></textarea>
                </div>
                <div id="forma-d29538a8-01be-4a3d-9896-a4b6bf2f0ecc" className="container bg-transparent" aria-label="Layout container">
                    <button id="forma-7ef436e6-4eea-48fd-85f7-0fd04917c7b1" className="btn-primary" aria-label="Circle" onClick={sendMessage}>
                        <img src={arrow_up} className="w-75 h-75" alt="arrow-icon"/>
                    </button>
                </div>
            </div>
        </div>
        
    </main>
  );
}
