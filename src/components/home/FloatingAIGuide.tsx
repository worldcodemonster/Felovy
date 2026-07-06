'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, RotateCcw } from 'lucide-react';
import { VirtualAgentOrb, type CharacterState } from './VirtualAgentOrb';

const FELI_CHAT_URL = '/api/ai/chat';

const QUICK = [
  'How does verification work?',
  'I want to hire a developer',
  'How do I find jobs?',
  'What services does Felovy offer?',
];

const SECTION_LABELS: { id: string; label: string; tip: string }[] = [
  { id: 'hero', label: 'Welcome', tip: "Hi! I'm Feli, your Felovy guide ✨" },
  { id: 'services', label: 'Our Services', tip: 'Explore 12 software domains we cover' },
  { id: 'how-it-works', label: 'How Felovy Works', tip: 'See developer & employer workflows' },
  { id: 'faqs', label: 'FAQs', tip: 'Common questions about Felovy' },
];

function MiniAvatar({ state }: { state: CharacterState }) {
  const emoji = state === 'thinking' ? '🤔' : state === 'happy' ? '✨' : '🧚';
  return (
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
      {emoji}
    </div>
  );
}

interface Msg {
  role: 'ai' | 'user';
  text: string;
}

const GREETING =
  "Hi! I'm Feli, your Felovy AI guide ✨ Ask me about verification, hiring, jobs, our 12 service domains, or how the platform works.";

export function FloatingAIGuide() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'ai', text: GREETING }]);
  const [input, setInput] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [currentSection, setCurrentSection] = useState(SECTION_LABELS[0]);
  const [showTip, setShowTip] = useState(false);
  const [typing, setTyping] = useState(false);
  const [charState, setCharState] = useState<CharacterState>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleOpen = () => setOpen((prev) => !prev);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = SECTION_LABELS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          const top = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
          );
          const label = SECTION_LABELS.find((s) => s.id === top.target.id);
          if (label) setCurrentSection(label);
        }
      },
      { threshold: 0.3 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (scrollY > 400 && !open) {
      setShowTip(true);
      const t = setTimeout(() => setShowTip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [currentSection, scrollY, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setCharState('greeting');
      const t = setTimeout(() => setCharState('happy'), 1600);
      return () => clearTimeout(t);
    }
    setCharState('idle');
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      const userMsg: Msg = { role: 'user', text: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setTyping(true);
      setCharState('thinking');

      const apiMessages = nextMessages.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      try {
        const res = await fetch(FELI_CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
        });

        const raw = await res.text();
        let data: { reply?: string; message?: string } = {};

        if (raw) {
          try {
            data = JSON.parse(raw) as { reply?: string; message?: string };
          } catch {
            data = {};
          }
        }

        let reply: string;

        if (res.ok && data.reply) {
          reply = data.reply;
        } else if (data.message) {
          reply = data.message;
        } else if (res.status === 504 || res.status === 502) {
          reply =
            'Feli is taking a bit longer than usual. Please try again in a moment, or browse /jobs and /signup in the meantime.';
        } else {
          reply =
            "I'm having trouble connecting right now. Try again in a moment, or browse /#how-it-works and /#faqs on the site.";
        }

        setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
        setCharState('happy');
        setTimeout(() => setCharState('idle'), 2200);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: "I couldn't reach the AI service. Check your connection and try again, or explore /jobs and /signup in the meantime.",
          },
        ]);
        setCharState('idle');
      } finally {
        setTyping(false);
      }
    },
    [messages, typing],
  );

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end gap-2">
      {open && (
        <div
          className="chat-slide-up w-[340px] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: 490 }}
        >
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-felovy-red to-felovy-purple">
            <div className="relative shrink-0 rounded-full overflow-hidden" style={{ width: 32, height: 32 }}>
              <VirtualAgentOrb state={charState} width={32} height={32} variant="mini" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Feli, AI Guide</p>
              <p className="text-white/60 text-xs truncate">{currentSection.label}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setMessages([{ role: 'ai', text: GREETING }]);
                  setCharState('happy');
                  setTimeout(() => setCharState('idle'), 1500);
                }}
                className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                title="Reset conversation"
                type="button"
              >
                <RotateCcw className="h-3.5 w-3.5 text-white" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                type="button"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 260 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && <MiniAvatar state={charState} />}
                <div
                  className={`max-w-[230px] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ml-2 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-felovy-red to-felovy-pink text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start items-center gap-2">
                <MiniAvatar state="thinking" />
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-felovy-red/30 text-felovy-red hover:bg-felovy-light transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
              placeholder="Ask Feli anything…"
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-felovy-red/30 bg-gray-50"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              className="h-8 w-8 rounded-xl bg-gradient-to-br from-felovy-red to-felovy-pink text-white flex items-center justify-center disabled:opacity-40 hover:shadow-lg hover:shadow-rose-200 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {showTip && !open && (
        <div className="chat-slide-up bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs text-gray-700 max-w-[180px] text-center font-medium">
          {currentSection.tip}
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        className="group relative flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-felovy-red/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
        style={{ width: 72, height: 72, background: 'transparent', border: 'none', padding: 0 }}
        aria-label={open ? 'Close AI Guide' : 'Open AI Guide'}
        aria-expanded={open}
      >
        <VirtualAgentOrb state={charState} width={68} height={68} variant="portrait" />
        <span className="absolute inset-0 z-10 rounded-full" aria-hidden />
      </button>
    </div>
  );
}
