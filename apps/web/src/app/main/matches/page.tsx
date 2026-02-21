"use client";

import Link from 'next/link';
import { CaretRight, ChatCircleText } from '@phosphor-icons/react';

const MOCK_MATCHES = [
    { id: '1', user: 'Leo T.', userAvatar: 'https://i.pravatar.cc/150?u=4', lastMessage: "Sounds good, see you at the Starbucks in UP Town.", time: "10m ago", status: 'Meetup Scheduled', unread: 0, myItemPic: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100', theirItemPic: 'https://images.unsplash.com/photo-1614594975525-e45190c55d40?w=100' },
    { id: '2', user: 'Aria S.', userAvatar: 'https://i.pravatar.cc/150?u=5', lastMessage: "Is there any drift on the joycons?", time: "2h ago", status: 'Negotiating', unread: 1, myItemPic: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100', theirItemPic: 'https://images.unsplash.com/photo-1612053073739-1ff5734e5699?w=100' },
];

export default function MatchesList() {
    return (
        <div className="flex flex-col min-h-screen bg-background p-6">

            <header className="mb-6 pt-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Matches</h1>
                <p className="text-secondary text-sm">Active trades and conversations.</p>
            </header>

            <main className="flex-1 space-y-4">
                {MOCK_MATCHES.map(match => (
                    <Link key={match.id} href={`/main/matches/${match.id}`} className="block">
                        <div className="bg-surface-elevated rounded-2xl p-4 flex items-center gap-4 border border-surface-border shadow-elevated hover:bg-surface-border transition-colors group">

                            {/* Avatar Stack */}
                            <div className="relative w-14 h-14 flex-shrink-0">
                                <img src={match.userAvatar} alt={match.user} className="w-12 h-12 rounded-full border-2 border-background absolute z-10 bottom-0 left-0" />
                                <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center border-2 border-background z-20 overflow-hidden text-[8px] font-bold">
                                    <img src={match.theirItemPic} className="w-full h-full object-cover" />
                                </div>
                                {match.unread > 0 && (
                                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-primary text-background text-[10px] font-bold flex items-center justify-center rounded-full border border-background z-30">
                                        {match.unread}
                                    </span>
                                )}
                            </div>

                            {/* Chat Preview */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-foreground truncate">{match.user}</h3>
                                    <span className="text-[10px] text-secondary whitespace-nowrap">{match.time}</span>
                                </div>
                                <p className="text-secondary text-sm truncate mb-1">
                                    {match.unread > 0 ? <span className="text-foreground font-medium">{match.lastMessage}</span> : match.lastMessage}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${match.status === 'Meetup Scheduled' ? 'bg-primary' : 'bg-pending'}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{match.status}</span>
                                </div>
                            </div>

                            <CaretRight size={20} className="text-surface-border group-hover:text-primary transition-colors flex-shrink-0" weight="bold" />
                        </div>
                    </Link>
                ))}

                {MOCK_MATCHES.length === 0 && (
                    <div className="text-center py-20 text-secondary">
                        <ChatCircleText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No matches yet. Keep swiping!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
