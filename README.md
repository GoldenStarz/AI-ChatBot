# AI Chatbot — Assignment 2

A general-purpose AI chatbot built with **Next.js 15 (App Router), React 19 and Tailwind CSS v4**, powered by the **Google Gemini API** (`gemini-2.5-flash` by default).

## Features

- Chat with a general-purpose AI on any topic
- Full conversation history — the AI remembers earlier messages in the current chat
- Chat is saved in `localStorage`, so refreshing the page keeps the conversation
- "New chat" button to start over
- AI replies rendered with Markdown (headings, lists, tables, styled code blocks)
- Typing indicator and disabled input while the AI is replying
- Friendly in-chat error messages — the app never crashes on API errors
- API key kept server-side only, in `.env.local` (never sent to the browser)

## Setup

### 1. Get a free Gemini API key

1. Go to **Google AI Studio**: https://aistudio.google.com/app/apikey
2. Sign in with a Google account.
3. Click **Create API key** and copy the key.

### 2. Add the key

In the project folder, copy the example env file and paste your key:

```bash
copy .env.local.example .env.local
```

(Windows Command Prompt / PowerShell: use `copy`. On Mac/Linux: use `cp`.)

Then open `.env.local` and fill it in:

```env
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_MODEL` is optional — change it to use a different Gemini model.

### 3. Run the app

This project ships with `node_modules` already installed, so no `npm install` is needed:

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

If you ever delete `node_modules`, run `npm install` first, then `npm run dev`.

> If you open the app without a key, it will not break — it shows setup
> instructions in the chat instead of canned answers.

## Project structure

```
ai-chatbot/
├── app/
│   ├── api/chat/route.js   # Server API route: talks to the Gemini REST API
│   ├── layout.js           # Page shell (title, fonts, background)
│   ├── globals.css         # Tailwind + Markdown/code-block styling
│   └── page.js             # Chat UI (messages, input, history, errors)
├── .env.local.example      # Copy to .env.local and add your key
├── .gitignore              # Keeps .env.local and node_modules out of git
├── package.json
└── README.md
```

## How it works

- The chat UI (`app/page.js`) keeps messages in React state and saves them to `localStorage`.
- Every message you send goes to `POST /api/chat` together with the full conversation history.
- The API route (`app/api/chat/route.js`) adds a system prompt, then calls the Gemini REST API directly:
  `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  with the key from `process.env.GEMINI_API_KEY` — the key never leaves the server.
- Replies are rendered with `react-markdown` + `remark-gfm`.

## Submission checklist

- [ ] GitHub repository link
- [ ] Screenshots of the working chatbot
