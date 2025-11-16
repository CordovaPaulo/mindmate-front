'use client';

import React, { useMemo, useState } from 'react';
import axios from '@/lib/axios';
import { toast } from 'react-toastify';

type Mode = 'assist' | 'schedule' | 'summary' | 'motivation';

type ChatItem = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: Mode;
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('assist');
  const [history, setHistory] = useState<ChatItem[]>([
    {
      role: 'system',
      content:
        'Hi! I am MindMate AI Assistant. I can answer quick questions, show your upcoming sessions, summarize lesson text, or send a motivation.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 || mode === 'motivation', [input, mode]);

  async function send() {
    if (!canSend || busy) return;
    setBusy(true);

    const message = input.trim();
    const outgoing: ChatItem = mode === 'motivation' ? { role: 'user', content: 'Motivate me!', mode } : { role: 'user', content: message, mode };

    try {
      setHistory((h) => [...h, outgoing]);

      const res = await axios.post(
        '/ai/chat',
        {
          message,
          mode,
        },
        { withCredentials: true }
      );

      // Handle both string and object responses
      const reply: string = typeof res.data?.reply === 'string' 
        ? res.data.reply 
        : res.data?.reply?.answer || 'Sorry, I had trouble responding.';
      
      const incoming: ChatItem = { role: 'assistant', content: reply, mode: res.data?.mode || mode };
      setHistory((h) => [...h, incoming]);

      if ((res.data?.mode || mode) === 'motivation') {
        toast.success(reply);
      }

      setInput('');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to reach AI service.';
      setHistory((h) => [...h, { role: 'assistant', content: msg }]);
    } finally {
      setBusy(false);
    }
  }

  function onQuick(m: Mode) {
    setMode(m);
    if (m === 'motivation') {
      // send immediately
      send();
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 1000,
          borderRadius: '9999px',
          padding: '12px 16px',
          background: '#4F46E5',
          color: '#fff',
          border: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          cursor: 'pointer',
        }}
        aria-label="Open AI Assistant"
      >
        {open ? 'Close Assistant' : 'AI Assistant'}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 88,
            width: 480,
            maxWidth: '95vw',
            height: 620,
            maxHeight: '80vh',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="MindMate AI Assistant"
        >
          <div style={{ padding: 14, borderBottom: '1px solid #eee', fontWeight: 600 }}>MindMate AI Assistant</div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#fafafa' }}>
            {history.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                  <div style={{ maxWidth: '85%' }}>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4, textAlign: isUser ? 'right' : 'left' }}>
                      {m.role === 'user' ? 'You' : m.role === 'assistant' ? 'Assistant' : 'System'}
                    </div>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: isUser ? '#E0E7FF' : '#fff',
                        border: '1px solid #e5e7eb',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: 14,
                        lineHeight: '1.35',
                        textAlign: 'left',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderTop: '1px solid #eee', flexWrap: 'wrap' }}>
            <button
              onClick={() => onQuick('assist')}
              aria-pressed={mode === 'assist'}
              style={{
                padding: '6px 10px',
                borderRadius: 9999,
                border: '1px solid #e5e7eb',
                background: mode === 'assist' ? '#EEF2FF' : '#fff',
                cursor: 'pointer',
              }}
            >
              Assist
            </button>
            <button
              onClick={() => onQuick('schedule')}
              aria-pressed={mode === 'schedule'}
              style={{
                padding: '6px 10px',
                borderRadius: 9999,
                border: '1px solid #e5e7eb',
                background: mode === 'schedule' ? '#EEF2FF' : '#fff',
                cursor: 'pointer',
              }}
              title="Requires sign-in"
            >
              My Schedule
            </button>
            <button
              onClick={() => onQuick('summary')}
              aria-pressed={mode === 'summary'}
              style={{
                padding: '6px 10px',
                borderRadius: 9999,
                border: '1px solid #e5e7eb',
                background: mode === 'summary' ? '#EEF2FF' : '#fff',
                cursor: 'pointer',
              }}
            >
              Summarize
            </button>
            <button
              onClick={() => onQuick('motivation')}
              style={{
                padding: '6px 10px',
                borderRadius: 9999,
                border: '1px solid #e5e7eb',
                background: '#ECFDF5',
                cursor: 'pointer',
              }}
              disabled={busy}
              title="Sends a short motivational toast"
            >
              Motivate me
            </button>
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder={
                mode === 'summary'
                  ? 'Paste lesson text to summarize...'
                  : mode === 'schedule'
                  ? 'Ask about your upcoming sessions...'
                  : 'Ask a quick question...'
              }
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '10px 12px',
              }}
              aria-label="Type your message"
              disabled={busy}
            />
            <button
              onClick={send}
              disabled={!canSend || busy}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: busy ? '#9CA3AF' : '#4F46E5',
                color: '#fff',
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}