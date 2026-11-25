import { NextResponse } from "next/server";

// System prompt: defines how the chatbot behaves.
const SYSTEM_PROMPT = `You are a helpful general-purpose AI assistant.
Answer questions on any topic clearly and concisely.
Use Markdown for structure when it helps: headings, bullet lists, tables and
fenced code blocks for code. Keep answers focused and avoid unnecessary length.
If you do not know something, say so honestly instead of guessing.`;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Requirement 8: the key lives only in .env.local (server-side).
  // Without it, explain setup instead of breaking or faking an answer.
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "missing_api_key",
        message:
          "No Gemini API key is set up yet. Create a file named .env.local in the project folder with GEMINI_API_KEY=your-key (get a free key from Google AI Studio at https://aistudio.google.com/app/apikey), then restart the dev server with npm run dev.",
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "bad_request", message: "Send at least one message." },
      { status: 400 }
    );
  }

  // Requirement 4: send the full conversation history so the model
  // remembers previous messages within the current chat.
  const contents = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "network_error",
        message:
          "Could not reach the Gemini API. Check your internet connection and try again.",
      },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = data?.error?.message || `Gemini API returned ${res.status}.`;
    const friendly =
      res.status === 400
        ? `The request was rejected by the Gemini API: ${detail}`
        : res.status === 401 || res.status === 403
          ? `The Gemini API key was rejected (${detail}). Check that GEMINI_API_KEY in .env.local is correct and that the key is enabled in Google AI Studio.`
          : res.status === 429
            ? "The Gemini API rate limit was hit. Please wait a moment and try again."
            : `The Gemini API returned an error: ${detail}`;
    return NextResponse.json(
      { error: "api_error", message: friendly },
      { status: 502 }
    );
  }

  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("") || "";

  if (!reply.trim()) {
    return NextResponse.json(
      {
        error: "empty_response",
        message: "The AI returned an empty response. Please try again.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply });
}
