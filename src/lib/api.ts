/**
 * api.ts — typed client stub for the Cuisine-Expert backend.
 *
 * The backend lives at cuisine-api.verbalogix.com (deployed in M6).
 * During development, it is expected at localhost:8000.
 * All calls are client-side only — no build-time fetch.
 */

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_CUISINE_API_URL) ??
  'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

/**
 * Send a chat message to the Cuisine-Expert backend.
 * This is the only outbound API call this site makes at runtime.
 */
export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Chat API returned ${res.status}`);
  return res.json();
}
