'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Conversation, Message } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { EmptyState } from '@/components/shared/EmptyState';
import { Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { timeAgo, cn } from '@/lib/utils';
import Link from 'next/link';

export default function DeveloperMessagesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState('');

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.post('/messages/conversations', {});
      return res.json() as Promise<Conversation[]>;
    },
  });

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', activeConv],
    queryFn: async () => {
      const res = await api.post(`/messages/conversations/${activeConv}/messages/list`, {});
      return res.json() as Promise<Message[]>;
    },
    enabled: !!activeConv,
    refetchInterval: 5000, // Poll every 5s (Vercel-safe alternative to WebSocket)
  });

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => api.post(`/messages/conversations/${activeConv}/messages`, { content: text }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConv] });
    },
  });

  const active = conversations?.find(c => c.id === activeConv);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 container mx-auto max-w-6xl px-4 py-6 gap-4 h-[calc(100vh-72px)]">
        {/* Conversation list */}
        <div className={`w-72 flex-shrink-0 bg-white rounded-xl border overflow-y-auto ${activeConv ? 'hidden md:block' : ''}`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Messages</h2>
          </div>
          {!conversations?.length ? (
            <EmptyState
              illustration="empty-messages"
              title="No conversations yet"
              description="Apply for jobs and wait for employers to reach out"
              compact
              className="py-8"
            />
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 border-b transition-colors',
                  activeConv === conv.id && 'bg-felovy-light/30 border-l-2 border-l-felovy-red'
                )}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(conv.employer?.companyName || 'E')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{conv.employer?.companyName}</p>
                  <p className="text-xs text-gray-500 truncate">{conv.application?.job?.title}</p>
                  {conv.messages?.[0] && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.messages[0].content}</p>
                  )}
                </div>
                {conv.isBlocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        {activeConv ? (
          <div className="flex-1 bg-white rounded-xl border flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <button onClick={() => setActiveConv(null)} className="md:hidden"><ArrowLeft className="h-5 w-5" /></button>
              <div>
                <p className="font-semibold text-gray-900">{active?.employer?.companyName}</p>
                <p className="text-xs text-gray-500">{active?.application?.job?.title}</p>
              </div>
              <Badge variant={active?.application?.status === 'ACCEPTED' ? 'success' : 'secondary'} className="ml-auto text-xs">
                {active?.application?.status}
              </Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center pt-8"><Loader2 className="h-6 w-6 animate-spin text-felovy-red" /></div>
              ) : messages?.map(msg => {
                const isMe = msg.senderRole === 'DEVELOPER';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={cn(
                      'max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 text-sm',
                      isMe ? 'bg-gradient-to-br from-felovy-red to-felovy-pink text-white rounded-br-sm' :
                             'bg-gray-100 text-gray-900 rounded-bl-sm'
                    )}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            {!active?.isBlocked ? (
              <div className="border-t p-4 flex gap-3">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), text.trim() && send())}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-felovy-red"
                />
                <Button size="icon" variant="gradient" onClick={() => text.trim() && send()} disabled={isPending || !text.trim()}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="border-t p-4 text-center text-sm text-gray-400">
                This conversation has been blocked by the employer.
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-xl border text-gray-400 flex-col gap-3">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
