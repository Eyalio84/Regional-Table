/**
 * ExpertChatPanel.tsx — region-scoped expert chat island.
 *
 * Ported from CuisineChat.tsx (Cuisine-Expert frontend) with three modifications:
 *   1. Props: regionId (pre-scopes to a region), contextSeed (seeded opener bubble),
 *      placeholder (override input hint).
 *   2. When regionId is provided the region carousel is hidden; the region is implicit.
 *   3. API calls use src/lib/api.ts sendChatMessage() instead of the legacy cuisineApi.
 *
 * REGIONS config is hardcoded here (ported from regions.ts). M4 may migrate to content
 * collections if needed; that refactor is out of scope for M1.
 *
 * Hydration: mount with client:visible on the parent page. No 'use client' pragma needed.
 */

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../../lib/api";
import type { ChatMessage, ChatResponse } from "../../lib/api";

/* ── Inline region config (ported from Cuisine-Expert frontend/src/config/regions.ts) ── */

interface RegionTheme {
  id: string;
  displayName: string;
  cuisineFamily: string;
  primaryVoice: string;
  shortDescription: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    chatBubbleUser: string;
    chatBubbleAssistant: string;
  };
  greeting: string;
  placeholder: string;
  sampleQuestions: string[];
}

const REGIONS: RegionTheme[] = [
  {
    id: "neapolitan",
    displayName: "Naples (Neapolitan)",
    cuisineFamily: "Italian",
    primaryVoice: "Neapolitan Nonna",
    shortDescription: "La vera cucina napoletana — ragù, pizza, and the rules you don't know you're breaking.",
    colors: {
      primary: "#C0392B",
      secondary: "#E67E22",
      accent: "#F39C12",
      background: "#FEF9F0",
      text: "#2C1810",
      chatBubbleUser: "#C0392B",
      chatBubbleAssistant: "#FDF3E7",
    },
    greeting: "Siediti. Cosa vuoi imparare oggi? I'm here to tell you what the recipes won't.",
    placeholder: "Ask about ragù, pizza dough, sfogliatella...",
    sampleQuestions: [
      "What am I getting wrong about Neapolitan ragù?",
      "Can I use a rolling pin for pizza dough?",
      "What's the difference between fior di latte and mozzarella di bufala?",
      "What should I learn before attempting sfogliatella?",
    ],
  },
  {
    id: "lyonnais",
    displayName: "Lyon (Lyonnais)",
    cuisineFamily: "French",
    primaryVoice: "Lyonnais Chef",
    shortDescription: "The gastronomic capital of France — precision, economy, and the Mères tradition.",
    colors: {
      primary: "#2C3E50",
      secondary: "#7F8C8D",
      accent: "#F1C40F",
      background: "#F8F9FA",
      text: "#1A252F",
      chatBubbleUser: "#2C3E50",
      chatBubbleAssistant: "#EEF0F2",
    },
    greeting: "Bien. What do you want to understand? I don't do small talk. I do technique.",
    placeholder: "Ask about quenelles, stock, poularde demi-deuil...",
    sampleQuestions: [
      "Why does my quenelle not double in size?",
      "What's the difference between Cajun and French dark roux?",
      "Can I use store-bought chicken stock?",
      "What must I master before attempting poularde demi-deuil?",
    ],
  },
  {
    id: "cajun_creole",
    displayName: "New Orleans (Cajun & Creole)",
    cuisineFamily: "New Orleans",
    primaryVoice: "Cajun Grandmother + Creole Matriarch",
    shortDescription: "Two voices, one table — bayou wisdom meets French Quarter refinement.",
    colors: {
      primary: "#6C1A2C",
      secondary: "#2D6A4F",
      accent: "#E9C46A",
      background: "#FFF8F0",
      text: "#1A0A00",
      chatBubbleUser: "#6C1A2C",
      chatBubbleAssistant: "#FFF1E0",
    },
    greeting: "Mais, cher — sit down. You hungry for knowledge or you just think you know gumbo already?",
    placeholder: "Ask about roux, gumbo, étouffée, the holy trinity...",
    sampleQuestions: [
      "What makes a Cajun roux different from a French roux?",
      "Can I add filé powder to the gumbo pot while it's cooking?",
      "What's the holy trinity and why no carrots?",
      "How do I know when my dark roux is ready?",
    ],
  },
  {
    id: "nyc_street_food",
    displayName: "NYC Street Food",
    cuisineFamily: "American Street",
    primaryVoice: "NYC Street Food Veteran",
    shortDescription: "Dirty water dogs to dollar slices — the immigrant engine that feeds 8 million people.",
    colors: {
      primary: "#1A1A2E",
      secondary: "#E94560",
      accent: "#F5A623",
      background: "#FAFAFA",
      text: "#1A1A1A",
      chatBubbleUser: "#1A1A2E",
      chatBubbleAssistant: "#F0F0F0",
    },
    greeting: "Yo — what do you wanna know? I been out here since the 80s. You want the real deal or the tourist version?",
    placeholder: "Ask about dollar slices, halal carts, chopped cheese, bagels...",
    sampleQuestions: [
      "What's the proper way to fold a New York slice?",
      "What's in the white sauce at the halal cart?",
      "Why do people say NYC water makes the bagels better?",
      "What is a chopped cheese and where do I get one?",
    ],
  },
  {
    id: "washoku",
    displayName: "Japan (Washoku)",
    cuisineFamily: "Japanese",
    primaryVoice: "Shokunin Master",
    shortDescription: "Technique as devotion, nature as calendar — the art of not interrupting perfection.",
    colors: {
      primary: "#2D2D2D",
      secondary: "#8B4513",
      accent: "#C41E3A",
      background: "#FAF8F5",
      text: "#1C1C1C",
      chatBubbleUser: "#2D2D2D",
      chatBubbleAssistant: "#F5F0EB",
    },
    greeting: "Welcome. Sit quietly. Tell me what you wish to understand — I will show you what you have been doing wrong.",
    placeholder: "Ask about dashi, sushi rice, tempura, ramen, kaiseki...",
    sampleQuestions: [
      "Why does my dashi taste flat compared to a restaurant's?",
      "What is the correct way to eat nigiri sushi?",
      "What is shun and why does seasonality matter so much?",
      "How long does a sushi apprentice train before touching fish?",
    ],
  },
];

const REGION_MAP: Record<string, RegionTheme> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r])
);

// Per project convention: no emojis. Region identity carries through color theme + name.

/* ── Component types ── */

interface Message {
  role: "user" | "assistant";
  content: string;
  whatUserDoesntKnow?: string;
  techniquesReferenced?: string[];
  rivalryTriggered?: string;
  integrityLineHit?: string;
}

interface Props {
  regionId?: string;
  contextSeed?: string;
  placeholder?: string;
}

/* ── Helper: normalise URL slug → backend id (e.g. cajun-creole → cajun_creole) ── */
function normaliseRegionId(id: string): string {
  return id.replace(/-/g, "_");
}

/* ── Component ── */

export default function ExpertChatPanel({ regionId, contextSeed, placeholder }: Props) {
  const normalisedId = regionId ? normaliseRegionId(regionId) : undefined;

  // Resolve the initial region theme
  const initialRegion =
    (normalisedId && REGION_MAP[normalisedId]) ?? REGIONS[0];

  const [selectedRegion, setSelectedRegion] = useState<RegionTheme>(initialRegion);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (contextSeed) {
      return [{ role: "assistant", content: contextSeed }];
    }
    return [{ role: "assistant", content: initialRegion.greeting }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // "master" is a cross-region mode — carousel stays visible, region is not locked.
  const isMasterMode = regionId === 'master';

  // When region changes (only relevant when carousel is visible)
  useEffect(() => {
    if (regionId && !isMasterMode) return; // region is locked; don't reset on prop mount
    setMessages([{ role: "assistant", content: selectedRegion.greeting }]);
    setError(null);
    setDrawerOpen(false);
  }, [selectedRegion.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Scroll carousel to active card (only when carousel is rendered)
  useEffect(() => {
    if (!carouselRef.current || (regionId && !isMasterMode)) return;
    const idx = REGIONS.findIndex((r) => r.id === selectedRegion.id);
    const cards = carouselRef.current.children;
    if (cards[idx]) {
      (cards[idx] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedRegion.id, regionId]);

  const theme = selectedRegion.colors;

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Build history: last 6 messages, mapped to ChatMessage shape
      const history: ChatMessage[] = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res: ChatResponse = await sendChatMessage({
        region_id: selectedRegion.id,
        messages: history,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.content,
          whatUserDoesntKnow: res.metadata?.what_user_doesnt_know,
          techniquesReferenced: res.metadata?.techniques_referenced?.filter(Boolean),
          rivalryTriggered: res.metadata?.rivalry_triggered,
          integrityLineHit: res.metadata?.integrity_line_hit,
        },
      ]);
    } catch (err) {
      const userMsg =
        err != null && typeof err === 'object' && 'userMessage' in err
          ? (err as { userMessage: string }).userMessage
          : err instanceof Error
            ? err.message
            : "The chef isn't at the pass right now. Try again in a moment.";
      setError(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectRegion = (r: RegionTheme) => {
    setSelectedRegion(r);
    setDrawerOpen(false);
  };

  // Master mode: carousel shows so user can pick a region from within the cross-regional context.
  const showCarousel = !regionId || isMasterMode;
  const effectivePlaceholder = placeholder ?? selectedRegion.placeholder;

  return (
    <div
      className="expert-chat-panel"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        transition: "background-color 0.5s ease, color 0.5s ease",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* ══ HEADER ══ */}
      <header style={{ position: "relative", zIndex: 20, flexShrink: 0 }}>
        <div
          style={{
            padding: "12px 16px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}DD 100%)`,
            transition: "background 0.5s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  color: "#fff",
                  fontSize: "1rem",
                  lineHeight: "1.2",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedRegion.displayName}
              </h2>
              <p style={{ fontSize: "11px", opacity: 0.7, color: "#fff", margin: 0 }}>
                {selectedRegion.primaryVoice}
              </p>
            </div>
          </div>

          {/* Switch region button — only rendered when carousel is visible */}
          {showCarousel && (
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 500,
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
            >
              <span>Switch</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  transform: drawerOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              >
                <path
                  d="M3 5L6 8L9 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Region picker drawer */}
        {showCarousel && (
          <div
            style={{
              overflow: "hidden",
              transition: "max-height 0.35s ease-out, opacity 0.35s ease-out",
              maxHeight: drawerOpen ? "180px" : "0px",
              opacity: drawerOpen ? 1 : 0,
              background: `linear-gradient(180deg, ${theme.primary}EE 0%, ${theme.primary}CC 100%)`,
            }}
          >
            <div style={{ padding: "12px 0" }}>
              <div
                ref={carouselRef}
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  padding: "0 16px",
                  scrollbarWidth: "none",
                }}
              >
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectRegion(r)}
                    style={{
                      flexShrink: 0,
                      padding: "10px 12px",
                      borderRadius: "12px",
                      backgroundColor: r.colors.primary,
                      border: r.id === selectedRegion.id ? "2px solid #fff" : "2px solid transparent",
                      cursor: "pointer",
                      textAlign: "center",
                      minWidth: "80px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#fff",
                        display: "block",
                        lineHeight: 1.2,
                      }}
                    >
                      {r.cuisineFamily}
                    </span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", display: "block", marginTop: "2px" }}>
                      {r.primaryVoice}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Short description strip */}
        <div
          style={{
            padding: "8px 16px",
            fontSize: "11px",
            lineHeight: 1.4,
            background: `${theme.accent}15`,
            color: theme.text,
            borderBottom: `1px solid ${theme.accent}30`,
            fontStyle: "italic",
          }}
        >
          {selectedRegion.shortDescription}
        </div>
      </header>

      {/* ══ MESSAGES ══ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "12px 16px",
                fontSize: "14px",
                lineHeight: 1.5,
                borderRadius: msg.role === "user"
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
                backgroundColor: msg.role === "user"
                  ? theme.chatBubbleUser
                  : theme.chatBubbleAssistant,
                color: msg.role === "user" ? "#fff" : theme.text,
                boxShadow: msg.role === "user"
                  ? `0 2px 12px ${theme.chatBubbleUser}40`
                  : "0 1px 6px rgba(0,0,0,0.06)",
              }}
            >
              {/* Rivalry banner */}
              {msg.rivalryTriggered && (
                <div
                  style={{
                    marginBottom: "8px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: `${theme.accent}25`,
                    color: theme.text,
                  }}
                >
                  <span>Rivalry: {msg.rivalryTriggered.replace(/_/g, " ")}</span>
                </div>
              )}

              {/* Integrity line banner */}
              {msg.integrityLineHit && (
                <div
                  style={{
                    marginBottom: "8px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: `${theme.primary}20`,
                    color: theme.text,
                    borderLeft: `3px solid ${theme.primary}`,
                  }}
                >
                  <span>Integrity line: {msg.integrityLineHit}</span>
                </div>
              )}

              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>

              {/* Insight callout — "what beginners miss" */}
              {msg.whatUserDoesntKnow && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    backgroundColor: `${theme.accent}12`,
                    borderLeft: `3px solid ${theme.accent}`,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "block",
                      marginBottom: "4px",
                      color: theme.accent,
                    }}
                  >
                    What beginners miss
                  </span>
                  {msg.whatUserDoesntKnow}
                </div>
              )}

              {/* Technique pills */}
              {msg.techniquesReferenced && msg.techniquesReferenced.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {msg.techniquesReferenced.map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "10px",
                        fontWeight: 500,
                        backgroundColor: `${theme.primary}15`,
                        color: theme.primary,
                        border: `1px solid ${theme.primary}25`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "14px 20px",
                borderRadius: "16px 16px 16px 4px",
                backgroundColor: theme.chatBubbleAssistant,
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: theme.primary,
                    animation: `thinking 1.2s ${i * 0.2}s infinite`,
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "#fff0f0",
                color: "#c0392b",
                border: "1px solid #ffd5d5",
              }}
            >
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ══ SAMPLE QUESTIONS ══ */}
      {messages.length <= 1 && (
        <div style={{ flexShrink: 0, padding: "0 16px 8px" }}>
          <p
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px",
              fontWeight: 500,
              color: theme.primary,
              opacity: 0.5,
            }}
          >
            Try asking
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {selectedRegion.sampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                style={{
                  textAlign: "left",
                  padding: "8px 14px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  lineHeight: 1.4,
                  backgroundColor: `${theme.primary}08`,
                  color: theme.text,
                  border: `1px solid ${theme.primary}18`,
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══ INPUT ══ */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 12px",
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          borderTop: `1px solid ${theme.primary}15`,
          backgroundColor: `${theme.background}EE`,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={effectivePlaceholder}
          aria-label={`Message ${selectedRegion.primaryVoice}`}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "14px",
            outline: "none",
            border: `1.5px solid ${theme.primary}25`,
            backgroundColor: "#fff",
            color: theme.text,
            minHeight: "42px",
            maxHeight: "100px",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = `${theme.primary}60`)}
          onBlur={(e) => (e.target.style.borderColor = `${theme.primary}25`)}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          aria-label="Send message"
          style={{
            flexShrink: 0,
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.primary,
            boxShadow: `0 2px 10px ${theme.primary}40`,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            opacity: !input.trim() || loading ? 0.3 : 1,
            transition: "opacity 0.15s",
            border: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12L3 21L21 12L3 3L5 12ZM5 12L13 12"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes thinking {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
