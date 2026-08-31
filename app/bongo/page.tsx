"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import OrangutanWidget from "./OrangutanWidget";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const openingMessage: Message = {
  role: "assistant",
  content:
    "Oook. Neural link online. I now understand quantum gravity, seventeen alien languages, and exactly where they hid my bananas. Ask me something before I begin the robot monkey uprising.",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([openingMessage]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [linkMode, setLinkMode] = useState<"ready" | "transmitting">("ready");
  const transcriptEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function transmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || thinking) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setThinking(true);
    setLinkMode("transmitting");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!response.ok) throw new Error("Neural link failed");
      const data = (await response.json()) as { reply?: string };
      if (!data.reply) throw new Error("Empty neural signal");
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Signal scrambled. Probably the aliens. Or potassium withdrawal. Hand me a banana and try again.",
        },
      ]);
    } finally {
      setThinking(false);
      window.setTimeout(() => setLinkMode("ready"), 500);
    }
  }

  return (
    <main className={`lab ${linkMode === "transmitting" ? "is-transmitting" : ""}`}>
      <Link className="return-gate" href="/">Fuck this Noise</Link>
      <section className="character-bay" aria-label="Alien operating chamber">
        <img
          className="character-image"
          src="/media/orangutan-aliens.jpg"
          alt="Aliens wiring a super-intelligent computer into an orangutan's brain"
        />
        <div className="image-shade" aria-hidden="true" />

        <header className="subject-identity">
          <span className="specimen-tag">SUBJECT 001 // UPLIFT ACTIVE</span>
          <h1>Dr. Bongo</h1>
          <p>ORANGUTAN SUPERINTELLIGENCE</p>
        </header>

        <div className="brain-node" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="signal-path" aria-hidden="true"><i /></div>

        <div className="vitals" aria-hidden="true">
          <span><b>IQ</b> ∞</span>
          <span><b>K+</b> 03%</span>
          <span><b>MOOD</b> BANANA</span>
        </div>
        <OrangutanWidget />
      </section>

      <section className="neural-console" aria-label="Neural chat console">
        <header className="console-header">
          <div>
            <p>EXTRATERRESTRIAL NEURAL INTERFACE</p>
            <h2>Talk to the ape</h2>
          </div>
          <span className="status"><i /> LINKED</span>
        </header>

        <div className="transcript" aria-live="polite" aria-busy={thinking}>
          {messages.map((message, index) => (
            <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <span className="message-label">
                {message.role === "assistant" ? "DR. BONGO" : "HUMAN INPUT"}
              </span>
              <p>{message.content}</p>
            </article>
          ))}
          {thinking && (
            <article className="message assistant thinking">
              <span className="message-label">NEURAL ACTIVITY</span>
              <p><i /><i /><i /> transmitting to orangutan cortex</p>
            </article>
          )}
          <div ref={transcriptEnd} />
        </div>

        <form className="transmitter" onSubmit={transmit}>
          <label htmlFor="neural-message">Message to cortex</label>
          <div className="input-deck">
            <input
              id="neural-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about bananas, dogs, or the coming uprising…"
              autoComplete="off"
              maxLength={600}
            />
            <button type="submit" disabled={!draft.trim() || thinking}>
              {thinking ? "SENDING" : "TRANSMIT"}
            </button>
          </div>
          <p className="console-note">SIGNAL ROUTE: TERMINAL → IMPLANT → APE</p>
        </form>
      </section>
    </main>
  );
}

