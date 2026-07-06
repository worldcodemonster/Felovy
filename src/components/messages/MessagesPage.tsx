'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Conversation, Message, DeveloperSearchResult } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { EmptyState } from '@/components/shared/EmptyState';
import { Send, Loader2, MessageSquare, ArrowLeft, Search, X } from 'lucide-react';
import { timeAgo, cn } from '@/lib/utils';

function Avatar({ name, photoUrl, size = 10 }: { name?: string; photoUrl?: string; size?: number }) {
  const sizeClass = `h-${size} w-${size}`;
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

interface Props {
  role: 'EMPLOYER' | 'OWNER';
}

export function MessagesPage({ role }: Props) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.post('/messages/conversations', {});
      return res.json() as Promise<Conversation[]>;
    },
  });

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['dev-search', searchQ],
    queryFn: async () => {
      const res = await api.post('/developers/search', { q: searchQ });
      return res.json() as Promise<DeveloperSearchResult[]>;
    },
    enabled: showSearch && searchQ.trim().length >= 2,
  });

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', activeConv],
    queryFn: async () => {
      const res = await api.post(`/messages/conversations/${activeConv}/messages/list`, {});
      return res.json() as Promise<Message[]>;
    },
    enabled: !!activeConv,
    refetchInterval: 5000,
  });

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: () => api.post(`/messages/conversations/${activeConv}/messages`, { content: text }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConv] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const { mutate: startDirect, isPending: starting } = useMutation({
    mutationFn: (devId: string) => api.post(`/messages/direct/${devId}`, {}),
    onSuccess: async (res) => {
      const conv = await res.json() as Conversation;
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConv(conv.id);
      setShowSearch(false);
      setSearchQ('');
    },
  });

  const active = conversations?.find(c => c.id === activeConv);

  const getConvName = useCallback((conv: Conversation) => {
    if (conv.application?.developer?.fullName) return conv.application.developer.fullName;
    if (conv.developer?.fullName) return conv.developer.fullName;
    return 'Developer';
  }, []);

  const getConvPhoto = useCallback((conv: Conversation) => {
    return conv.application?.developer?.photoUrl || conv.developer?.photoUrl;
  }, []);

  const getConvSubline = useCallback((conv: Conversation) => {
    if (conv.application?.job?.title) return `Re: ${conv.application.job.title}`;
    if (conv.developer?.title) return conv.developer.title;
    return 'Direct message';
  }, []);

  const activeName  = active ? getConvName(active) : '';
  const activePhoto = active ? getConvPhoto(active) : undefined;
  const activeSub   = active ? getConvSubline(active) : '';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 container mx-auto max-w-6xl px-4 py-6 gap-4 h-[calc(100vh-72px)]">

        {/* Sidebar */}
        <div className={`w-72 flex-shrink-0 bg-white rounded-xl border flex flex-col overflow-hidden ${activeConv ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Messages</h2>
              <button
                onClick={() => { setShowSearch(v => !v); setSearchQ(''); }}
                className={cn('p-1.5 rounded-lg transition-colors', showSearch ? 'bg-felovy-light text-felovy-red' : 'hover:bg-gray-100 text-gray-500')}
              >
                {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search developers..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-felovy-red"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Search results */}
            {showSearch && searchQ.trim().length >= 2 ? (
              <div>
                {searching ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>
                ) : !searchResults?.length ? (
                  <p className="text-center py-8 text-sm text-gray-400">No developers found</p>
                ) : (
                  searchResults.map(dev => (
                    <button
                      key={dev.id}
                      disabled={starting}
                      onClick={() => startDirect(dev.id)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 border-b transition-colors"
                    >
                      <Avatar name={dev.fullName} photoUrl={dev.photoUrl} size={9} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{dev.fullName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{dev.title || dev.location || ''}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : showSearch && searchQ.trim().length < 2 ? (
              <p className="text-center py-8 text-xs text-gray-400">Type at least 2 characters</p>
            ) : !conversations?.length ? (
              <EmptyState
                illustration="empty-messages"
                title="No conversations yet"
                description="Search for a developer to start chatting"
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
                  <Avatar name={getConvName(conv)} photoUrl={getConvPhoto(conv)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{getConvName(conv)}</p>
                    <p className="text-xs text-gray-400 truncate">{getConvSubline(conv)}</p>
                    {conv.messages?.[0] && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{conv.messages[0].content}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {activeConv ? (
          <div className="flex-1 bg-white rounded-xl border flex flex-col min-h-0">
            <div className="flex items-center gap-3 p-4 border-b flex-shrink-0">
              <button onClick={() => setActiveConv(null)} className="md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar name={activeName} photoUrl={activePhoto} />
              <div>
                <p className="font-semibold text-gray-900">{activeName}</p>
                <p className="text-xs text-gray-500">{activeSub}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center pt-8"><Loader2 className="h-6 w-6 animate-spin text-felovy-red" /></div>
              ) : messages?.map(msg => {
                const isMe = msg.senderRole !== 'DEVELOPER';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={cn(
                      'max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 text-sm',
                      isMe
                        ? 'bg-gradient-to-br from-felovy-red to-felovy-pink text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
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

            {!active?.isBlocked ? (
              <div className="border-t p-4 flex gap-3 flex-shrink-0">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), text.trim() && send())}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-felovy-red"
                />
                <Button size="icon" variant="gradient" onClick={() => text.trim() && send()} disabled={sending || !text.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="border-t p-4 text-center text-sm text-gray-400 flex-shrink-0">
                This conversation has been blocked.
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-xl border text-gray-400 flex-col gap-3">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p className="text-sm">Select a conversation or search for a developer</p>
          </div>
        )}
      </div>
    </div>
  );
}
