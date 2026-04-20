/**
 * api.ts — typed client for the Cuisine-Expert backend.
 *
 * Backend endpoint: POST /api/v1/chat
 *   Request  shape (backend):  { region: string, message: string }
 *   Response shape (backend):  { response: string, metadata?: {...} }
 *
 * This module translates between the frontend's conversation-history model
 * (ExpertChatPanel keeps the full message array) and the backend's single-
 * message, stateless model. Only the LAST user message is sent to the
 * backend; it responds based on its KG + regional persona without needing
 * prior turns.
 */

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_CUISINE_API_URL) ??
  'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Client-facing request shape. The frontend passes the full message history
 * for continuity; we extract the latest user turn for the backend call.
 */
export interface ChatRequest {
  region_id: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  content: string;
  metadata?: {
    techniques_referenced?: string[];
    integrity_line_hit?: string;
    rivalry_triggered?: string;
    what_user_doesnt_know?: string;
  };
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const lastUserMessage = [...req.messages]
    .reverse()
    .find((m) => m.role === 'user')?.content;

  if (!lastUserMessage) {
    throw Object.assign(new Error('No user message to send'), {
      userMessage: 'Type a question first.',
    });
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region: req.region_id,
        message: lastUserMessage,
      }),
    });
  } catch (networkErr) {
    console.error('Chat API network error:', networkErr);
    throw Object.assign(new Error('Network error'), {
      userMessage: "The chef isn't at the pass right now. Try again in a moment.",
    });
  }

  if (!res.ok) {
    console.error(`Chat API error: HTTP ${res.status}`);
    let userMessage: string;
    if (res.status === 429) {
      userMessage = "You've asked a lot of questions in a short time. The kitchen needs a breath — try again in an hour.";
    } else if (res.status >= 400 && res.status < 500) {
      userMessage = "Something about that question didn't reach the kitchen. Try rephrasing.";
    } else {
      userMessage = "The chef isn't at the pass right now. Try again in a moment.";
    }
    throw Object.assign(new Error(`Chat API returned ${res.status}`), { userMessage });
  }

  const data = await res.json();

  // Backend returns `{ response: string, metadata?: {...} }` — translate to
  // the ChatResponse shape the frontend components expect.
  return {
    content: data.response ?? data.content ?? '',
    metadata: data.metadata,
  };
}
