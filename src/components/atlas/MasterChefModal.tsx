/**
 * MasterChefModal.tsx — Master Chef chat modal (upgraded in M4).
 *
 * M0.5: scaffold with placeholder text + sample question chips.
 * M4: upgraded to render ExpertChatPanel with regionId="master", giving
 *     the modal full chat capability with region carousel visible.
 *
 * Listens for 'open-master-chef' custom event on window.
 * Escape key closes. Backdrop click closes. Self-hides on /ask (see FloatingChefPill).
 */

import { useState, useEffect, useCallback } from 'react';
import ExpertChatPanel from '../chat/ExpertChatPanel';

export default function MasterChefModal() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const handleOpen = useCallback(() => setOpen(true), []);

  useEffect(() => {
    window.addEventListener('open-master-chef', handleOpen);
    return () => window.removeEventListener('open-master-chef', handleOpen);
  }, [handleOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="mcm-overlay" role="dialog" aria-modal="true" aria-label="Master Chef chat">
      {/* Backdrop */}
      <div className="mcm-backdrop" onClick={close} aria-hidden="true" />

      {/* Modal panel */}
      <div className="mcm-panel">
        {/* Header */}
        <div className="mcm-header">
          <span className="mcm-wordmark">THE MASTER CHEF</span>
          <button
            className="mcm-close"
            onClick={close}
            aria-label="Close Master Chef chat"
          >
            ×
          </button>
        </div>

        {/* Body — full ExpertChatPanel in master mode */}
        <div className="mcm-body">
          <ExpertChatPanel
            regionId="master"
            contextSeed="I'm the Master Chef. Every kitchen is open. What do you want to understand?"
          />
        </div>
      </div>

      <style>{`
        .mcm-overlay {
          position: fixed;
          inset: 0;
          z-index: var(--z-modal, 100);
          display: flex;
          align-items: flex-end;
        }
        .mcm-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
        }
        .mcm-panel {
          position: relative;
          width: 100%;
          max-height: 72vh;
          background: var(--bg, #f3ecd9);
          border-top: 2px solid var(--accent, #b8860b);
          border-radius: 12px 12px 0 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: mcm-enter var(--motion-base, 400ms) var(--ease-emerge, cubic-bezier(0.16,1,0.3,1)) forwards;
        }
        @keyframes mcm-enter {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mcm-panel { animation: none; }
        }
        @media (min-width: 768px) {
          .mcm-overlay { justify-content: center; }
          .mcm-panel {
            max-width: 640px;
            border-radius: 12px 12px 0 0;
          }
        }
        .mcm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-5);
          border-bottom: 1px solid var(--rule-faint, #d6cdb8);
          flex-shrink: 0;
          background: var(--bg, #f3ecd9);
        }
        .mcm-wordmark {
          font-family: var(--ff-sans, sans-serif);
          font-size: var(--fs-caps, 0.75rem);
          font-weight: 500;
          letter-spacing: var(--tracking-caps, 0.15em);
          text-transform: uppercase;
          color: var(--fg, #1a1611);
        }
        .mcm-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          line-height: 1;
          color: var(--rule-strong, #5a4e3a);
          padding: 0 var(--space-2);
        }
        .mcm-close:hover { color: var(--fg, #1a1611); }
        .mcm-body {
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }
      `}</style>
    </div>
  );
}
