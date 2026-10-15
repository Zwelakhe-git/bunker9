import { useEffect, useState } from "react";
import { apiClient } from "./api/client";
import type { Message } from "./types";
import arrow_up from "./assets/arrow_up.ico";

export default function App() {
    const [ characters, setCharacters] = useState<string[]>([]);
    useEffect(() => {
        setCharacters(["Ego", "Self"])
    }, []);
  return (
    <main id="artboard" className="d-flex artboard flex-row">
        <div id="left-panel" className="w-12 h-100 border-1 p-2">
            <div className="panel-title">
                <h3>Characters</h3>
            </div>
            <div id="characters-list" className="w-100 d-flex gap-2 flex-column">
                {characters.map((character, idx) => (
                    <li key={idx * (5 + Math.random() * (5))} className="character">{character}</li>
                ))
                }
            </div>
        </div>
        <div id="right-panel" className="w-100 h-100">
            <div className="chats-area"></div>
            <div id="message-area" className="container" aria-label="Layout container">
                <div id="message-box" className="rectangle bg-transparent" aria-label="Rectangle">
                    <textarea id="message-inp" placeholder="Message"></textarea>
                </div>
                <div id="forma-d29538a8-01be-4a3d-9896-a4b6bf2f0ecc" className="container bg-transparent" aria-label="Layout container">
                    <div id="forma-7ef436e6-4eea-48fd-85f7-0fd04917c7b1" className="circle" aria-label="Circle">
                        <img src={arrow_up} className="w-75 h-75" alt="arrow-icon"/>
                    </div>
                </div>
            </div>
        </div>
        
    </main>
  );
}
