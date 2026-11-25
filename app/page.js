"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STORAGE_KEY = "ai-chatbot-messages-v1";
const THEME_KEY = "ai-chatbot-theme";

const SUGGESTIONS = [
  "Explain photosynthesis in simple terms",
  "Write a Python function to check if a number is prime",
  "Give me 5 tips for better time management",
  "What is the difference between AI and machine learning?",
];

const SETUP_MESSAGE = `No Gemini API key is set up yet. To start chatting:

1. Go to **Google AI Studio** — https://aistudio.google.com/app/apikey — and create a free API key.
2. In the project folder, copy **.env.local.example** to **.env.local** and paste your key after \`GEMINI_API_KEY=\`.
3. Restart the dev server (\`npm run dev\`).

Your key stays on the server in \`.env.local\` and is never sent to the browser.`;

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <span className="typing-dot h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
      <span className="typing-dot h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
      <span className="typing-dot h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState("light");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Load the saved theme (or the system preference) on first render.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const initial =
        saved === "dark" || saved === "light"
          ? saved
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      setTheme(initial);
      document.documentElement.classList.toggle("dark", initial === "dark");
    } catch {
      // Storage unavailable: stay in light mode.
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Storage unavailable: the theme still applies for this visit.
    }
  }

  // Load the saved chat from localStorage on first render.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setMessages(saved);
    } catch {
      // Corrupt saved data: start fresh.
    }
    setLoaded(true);
  }, []);

  // Persist the current chat so a refresh keeps it.
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, loaded]);

  // Keep the latest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage = { role: "user", content };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Friendly in-chat error, never a crash.
        const message =
          data?.error === "missing_api_key"
            ? SETUP_MESSAGE
            : data?.message ||
              "Something went wrong while talking to the AI. Please try again.";
        setMessages([...history, { role: "assistant", content: message }]);
        return;
      }

      setMessages([
        ...history,
        { role: "assistant", content: data.reply || "No reply received." },
      ]);
    } catch {
      setMessages([
        ...history,
        {
          role: "assistant",
          content:
            "Could not reach the server. Check that the dev server is running and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setMessages([]);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="animate-fade-in flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 transition-colors sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <div className="animate-orb h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-200 dark:shadow-indigo-950" />
            <span className="absolute text-xs font-bold tracking-tight text-white">
              AI
            </span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white">
              😒Cool-Bot
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="relative inline-flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              General-purpose assistant · Next.js + Gemini
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition hover:scale-105 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {theme === "dark" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={newChat}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:scale-[1.03] hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            disabled={loading && messages.length === 0}
          >
            New chat
          </button>
        </div>
      </header>

      {/* Messages */}
      <main
        ref={listRef}
        className="chat-scroll mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6"
      >
        {messages.length === 0 && (
          <div className="relative my-auto text-center">
            <div
              aria-hidden
              className="animate-blob pointer-events-none absolute -left-16 -top-10 h-48 w-48 rounded-full bg-indigo-200 opacity-50 blur-3xl dark:bg-indigo-800 dark:opacity-30"
            />
            <div
              aria-hidden
              className="animate-blob pointer-events-none absolute -bottom-12 -right-10 h-48 w-48 rounded-full bg-fuchsia-200 opacity-50 blur-3xl dark:bg-fuchsia-800 dark:opacity-30"
              style={{ animationDelay: "-7s" }}
            />
            <h2 className="animate-gradient-text relative text-xl font-semibold sm:text-2xl">
              Ask me anything
            </h2>
            <p
              className="animate-fade-in relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400"
              style={{ animationDelay: "0.15s" }}
            >
              I can answer questions on different topics, explain concepts,
              help with code, and more. Your conversation stays in this chat
              and is remembered while you talk.
            </p>
            <div className="relative mx-auto mt-6 grid max-w-lg gap-2 text-left sm:grid-cols-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  style={{ animationDelay: `${0.2 + i * 0.08}s` }}
                  className="animate-chip-in rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`animate-message-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "user" ? (
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-slate-900 px-4 py-2.5 text-[0.925rem] leading-relaxed text-white transition-colors sm:max-w-[75%] dark:bg-slate-700">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-slate-800 shadow-sm ring-1 ring-slate-200 transition-colors sm:max-w-[85%] dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700">
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="animate-message-in flex justify-start">
            <TypingIndicator />
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type your message..."
            disabled={loading}
            className="max-h-40 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[0.925rem] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-105 hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
        <p className="pb-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          AI can make mistakes. Check important information.
        </p>
      </footer>
    </div>
  );
}
