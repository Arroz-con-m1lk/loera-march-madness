"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string | number;
  name: string;
  avatarImage?: string;
  mood: "online" | "away" | "legend";
  text: string;
  timestamp: string;
};

type ChatBoxProps = {
  messages: ChatMessage[];
  onAddMessage: (text: string) => void;
};

const MAX_CHAT_LENGTH = 280;

function ChatAvatar({
  avatarImage,
  name,
}: {
  avatarImage?: string;
  name: string;
}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-300/30 bg-neutral-800">
      {avatarImage ? (
        <img
          src={avatarImage}
          alt={`${name} avatar`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-neutral-700" />
      )}
    </div>
  );
}

export default function ChatBox({ messages, onAddMessage }: ChatBoxProps) {
  const [chatInput, setChatInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const trimmedInput = chatInput.trim();
  const isDisabled = trimmedInput.length === 0;

  const handleSubmit = () => {
    if (isDisabled) return;

    onAddMessage(trimmedInput);
    setChatInput("");

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/30">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">MySpace-ish Trash Talk Board</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Post hot takes, overreactions, and family-safe disrespect in real
            time.
          </p>
        </div>

        <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          {messages.length} posts
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-black shadow-inner shadow-cyan-500/10">
        <div className="flex items-center justify-between border-b border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(17,24,39,0.9))] px-4 py-3">
          <div className="font-mono text-sm text-cyan-200">
            Top 8 Trash Talk Space
          </div>

          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-fuchsia-400" />
            <span className="h-3 w-3 rounded-full bg-cyan-400" />
            <span className="h-3 w-3 rounded-full bg-lime-400" />
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,1))] px-4 py-5 font-mono text-sm">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-6 text-center text-neutral-400">
                No posts yet. Start the chaos.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-3 shadow-lg shadow-black/20"
                >
                  <div className="flex gap-3">
                    <ChatAvatar
                      avatarImage={message.avatarImage}
                      name={message.name}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-cyan-300">
                        <span className="font-bold">{message.name}</span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                            message.mood === "legend"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : message.mood === "away"
                              ? "bg-neutral-700 text-neutral-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {message.mood}
                        </span>

                        <span className="text-xs text-neutral-500">
                          {message.timestamp}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap break-words text-neutral-200">
                        {message.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-cyan-400/20 bg-neutral-950 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) =>
                  setChatInput(e.target.value.slice(0, MAX_CHAT_LENGTH))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={3}
                className="w-full resize-none rounded-xl border border-cyan-400/20 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500"
                placeholder="Drop your trash talk here..."
              />

              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-neutral-500">
                <span>Press Enter to post • Shift+Enter for a new line</span>
                <span>
                  {chatInput.length}/{MAX_CHAT_LENGTH}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                isDisabled
                  ? "cursor-not-allowed bg-cyan-400/40 text-black/60"
                  : "bg-cyan-400 text-black hover:scale-[1.02]"
              }`}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}