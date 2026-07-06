'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, RotateCcw } from 'lucide-react';
import { VirtualAgentOrb, type CharacterState } from './VirtualAgentOrb';

const QUICK = [
  'How does verification work?',
  'I want to hire a developer',
  'How do I find jobs?',
  'How does payment work?',
];

const SECTION_LABELS: { id: string; label: string; tip: string }[] = [
  { id: 'hero',     label: 'Welcome',         tip: "Hi! I'm Feli, your Felovy guide ✨" },
  { id: 'domains',  label: 'Domain Expertise', tip: 'Explore all 12 software domains' },
];

function aiReply(input: string): string {
  const m = input.toLowerCase();
  if (m.includes('verif'))
    return 'Verification is a 4-step process: government ID scan → live coding challenge → skills assessment → video introduction. Takes 2–3 hours and gives you a Verified badge.';
  if (m.includes('hire') || m.includes('employer') || m.includes('company'))
    return "Sign up as an employer, complete your company profile, and post your first job. You'll receive matched verified candidates in under 24 hours, no recruiter needed.";
  if (m.includes('job') || m.includes('find') || m.includes('apply'))
    return 'Create a developer account, complete verification, and your profile appears to thousands of companies. You can also browse 8,400+ open roles and apply directly.';
  if (m.includes('pay') || m.includes('escrow') || m.includes('money') || m.includes('cost'))
    return 'Payments go through our escrow system. Clients fund milestones upfront; developers receive payment only after milestone approval. Joining and browsing is always free.';
  if (m.includes('domain') || m.includes('industr') || m.includes('ai') || m.includes('web') || m.includes('mobile'))
    return 'Felovy covers 12 software domains: AI/ML, Data Science, Web Dev, Mobile, Cloud/DevOps, Cybersecurity, Blockchain, Game Dev, UI/UX, AR/VR, QA Testing, and AI Data Labeling.';
  if (m.includes('free') || m.includes('price') || m.includes('pricing'))
    return 'Joining Felovy is completely free for both developers and employers. We charge a small platform fee only when a contract is successfully signed.';
  if (m.includes('global') || m.includes('country') || m.includes('remote'))
    return 'Felovy operates in 80+ countries. Every job is remote-first unless specifically noted. Developers earn competitive global rates regardless of their location.';
  return "Great question! I'm Feli, your Felovy guide ✨ I can help with verification, hiring, finding jobs, payments, or domains we cover. What would you like to know?";
}

function MiniAvatar({ state }: { state: CharacterState }) {
  const emoji = state === 'thinking' ? '🤔' : state === 'happy' ? '✨' : '🧚';
  return (
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
      {emoji}
    </div>
  );
}

interface Msg { role: 'ai' | 'user'; text: string; }

export function FloatingAIGuide() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Msg[]>([
    { role: 'ai', text: "Hi! I'm Feli, your Felovy AI guide ✨ Ask me anything about developers, jobs, verification, or how the platform works." },
  ]);
  const [input, setInput]         = useState('');
  const [scrollY, setScrollY]     = useState(0);
  const [currentSection, setCurrentSection] = useState(SECTION_LABELS[0]);
  const [showTip, setShowTip]     = useState(false);
  const [typing, setTyping]       = useState(false);
  const [charState, setCharState] = useState<CharacterState>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const toggleOpen = () => setOpen(prev => !prev);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = SECTION_LABELS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length) {
        const top = visible.reduce((a, b) => a.boundingClientRect.top < b.boundingClientRect.top ? a : b);
        const label = SECTION_LABELS.find(s => s.id === top.target.id);
        if (label) setCurrentSection(label);
      }
    }, { threshold: 0.3 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (scrollY > 400 && !open) {
      setShowTip(true);
      const t = setTimeout(() => setShowTip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [currentSection]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setCharState('greeting');
      const t = setTimeout(() => setCharState('happy'), 1600);
      return () => clearTimeout(t);
    } else {
      setCharState('idle');
    }
  }, [open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    setCharState('thinking');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: aiReply(text) }]);
      setTyping(false);
      setCharState('happy');
      setTimeout(() => setCharState('idle'), 2200);
    }, 700 + Math.random() * 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end gap-2">
      {/* Chat panel */}
      {open && (
        <div className="chat-slide-up w-[340px] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 border border-gray-100 flex flex-col overflow-hidden" style={{ maxHeight: 490 }}>
          {/* Header */}
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
                  setMessages([{ role: 'ai', text: "Conversation reset! How can I help you? ✨" }]);
                  setCharState('happy');
                  setTimeout(() => setCharState('idle'), 1500);
                }}
                className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="h-3.5 w-3.5 text-white" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 260 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && <MiniAvatar state={charState} />}
                <div className={`max-w-[230px] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ml-2 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-felovy-red to-felovy-pink text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start items-center gap-2">
                <MiniAvatar state="thinking" />
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-felovy-red/30 text-felovy-red hover:bg-felovy-light transition-colors font-medium">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
              placeholder="Ask Feli anything…"
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-felovy-red/30 bg-gray-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              className="h-8 w-8 rounded-xl bg-gradient-to-br from-felovy-red to-felovy-pink text-white flex items-center justify-center disabled:opacity-40 hover:shadow-lg hover:shadow-rose-200 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTip && !open && (
        <div className="chat-slide-up bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs text-gray-700 max-w-[180px] text-center font-medium">
          {currentSection.tip}
        </div>
      )}

      {/* Floating virtual agent orb */}
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
