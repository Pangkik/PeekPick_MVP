"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CaretLeft, PaperPlaneRight, CalendarPlus, Handshake } from '@phosphor-icons/react';
import { cn } from '@peekpick/ui';

export default function ChatView({ params }: { params: { id: string } }) {
    const [msg, setMsg] = useState('');

    // Mock data
    const user = 'Aria S.';
    const userAvatar = 'https://i.pravatar.cc/150?u=5';
    const myItem = 'My Old iPhone';
    const theirItem = 'Nintendo Switch OLED';
    const status = 'Negotiating';

    const MOCK_CHAT = [
        { id: '1', sender: 'them', text: 'Hey! Saw you matched with my Switch.', time: '10:00 AM' },
        { id: '2', sender: 'me', text: 'Yeah! Is there any drift on the joycons?', time: '10:05 AM' },
        { id: '3', sender: 'them', text: 'Nope, replacing it because I got a Steam Deck. Your iPhone battery health?', time: '10:12 AM' },
    ];

    return (
        <div className="flex flex-col h-screen bg-background relative pb-[88px]">

            {/* Chat Header */}
            <header className="absolute top-0 inset-x-0 h-16 bg-surface-elevated border-b border-surface-border z-40 flex items-center px-4">
                <Link href="/main/matches" className="p-2 -ml-2 text-secondary hover:text-foreground">
                    <CaretLeft size={24} weight="bold" />
                </Link>
                <div className="flex items-center gap-3 ml-2 flex-1">
                    <img src={userAvatar} alt={user} className="w-10 h-10 rounded-full border border-surface-border" />
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-foreground truncate">{user}</h2>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider truncate">{status}</p>
                    </div>
                </div>
            </header>

            {/* Trade Actions Banner (Pinned under header) */}
            <div className="absolute top-16 inset-x-0 bg-surface border-b border-surface-border z-30 p-3 flex gap-2">
                <button className="flex-1 bg-surface-elevated border border-surface-border py-2 rounded-lg text-xs font-semibold text-foreground flex flex-col items-center justify-center gap-1 hover:bg-surface-border transition-colors">
                    <CalendarPlus size={16} className="text-primary" />
                    Schedule
                </button>
                <button className="flex-1 bg-primary/10 border border-primary/20 py-2 rounded-lg text-xs font-semibold text-primary flex flex-col items-center justify-center gap-1 hover:bg-primary/20 transition-colors">
                    <Handshake size={16} />
                    Agree Trade
                </button>
            </div>

            {/* Message History */}
            <main className="flex-1 overflow-y-auto pt-36 pb-20 px-4 space-y-4">
                {/* Trade Context Bubble */}
                <div className="flex justify-center mb-6">
                    <div className="bg-surface-elevated border border-surface-border rounded-full px-4 py-1.5 text-xs text-secondary font-medium shadow-sm">
                        Trading <span className="text-foreground">{myItem}</span> for <span className="text-foreground">{theirItem}</span>
                    </div>
                </div>

                {MOCK_CHAT.map(message => {
                    const isMe = message.sender === 'me';
                    return (
                        <div key={message.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                            <div className={cn(
                                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                                isMe
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-surface-elevated text-foreground border border-surface-border rounded-tl-sm"
                            )}>
                                {message.text}
                            </div>
                            <span className="text-[10px] text-secondary mt-1 px-1">{message.time}</span>
                        </div>
                    );
                })}
            </main>

            {/* Input Area */}
            <footer className="absolute bottom-[88px] inset-x-0 bg-surface-elevated border-t border-surface-border p-4 z-40">
                <div className="flex items-end gap-2">
                    <textarea
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] max-h-32 resize-none"
                        placeholder="Write a message..."
                        rows={1}
                    />
                    <button
                        disabled={!msg.trim()}
                        className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 flex-shrink-0 hover:scale-105 transition-transform"
                    >
                        <PaperPlaneRight size={20} weight="fill" />
                    </button>
                </div>
            </footer>
        </div>
    );
}
