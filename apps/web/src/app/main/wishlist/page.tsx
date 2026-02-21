"use client";

import { useState } from 'react';
import { Button } from '@peekpick/ui';
import { Plus, HandsClapping, Clock, MapPin } from '@phosphor-icons/react';
import Link from 'next/link';

const MOCK_REQUESTS = [
    { id: '1', user: 'Maria L.', avatar: 'https://i.pravatar.cc/150?u=1', request: "Looking for an acoustic guitar for a beginner, any brand is fine as long as playable. Willing to trade my old Kindle Paperwhite.", category: "Music & Instruments", distance: "0.8 km", time: "2h ago" },
    { id: '2', user: 'Anton D.', avatar: 'https://i.pravatar.cc/150?u=2', request: "Need unused moving boxes ASAP. Have some extra plants (Snake plant, Pothos) to swap.", category: "Home & Kitchen", distance: "1.2 km", time: "5h ago" },
    { id: '3', user: 'Sofia C.', avatar: 'https://i.pravatar.cc/150?u=3', request: "Searching for a graphing calculator (TI-84 preferred) for my engineering sem. Offering my Arduino starter kit.", category: "Electronics & Gadgets", distance: "3.5 km", time: "1d ago" }
];

export default function WishlistBoard() {
    return (
        <div className="flex flex-col min-h-screen bg-background p-6">

            {/* Header */}
            <header className="flex justify-between items-center mb-6 pt-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Wishlist</h1>
                    <p className="text-secondary text-sm">Community barter requests nearby.</p>
                </div>
                <button className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <Plus size={24} weight="bold" />
                </button>
            </header>

            {/* Feed */}
            <main className="flex-1 space-y-4">
                {MOCK_REQUESTS.map(req => (
                    <div key={req.id} className="bg-surface-elevated rounded-2xl p-5 border border-surface-border shadow-elevated group">

                        {/* User Info */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <img src={req.avatar} alt={req.user} className="w-10 h-10 rounded-full border border-surface-border" />
                                <div>
                                    <h3 className="font-semibold text-foreground text-sm">{req.user}</h3>
                                    <div className="flex items-center gap-2 text-secondary text-xs mt-0.5">
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {req.distance}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {req.time}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded flex-shrink-0">
                                {req.category}
                            </span>
                        </div>

                        {/* Request Body */}
                        <p className="text-foreground leading-relaxed text-sm mb-5">
                            "{req.request}"
                        </p>

                        {/* Action */}
                        <div className="border-t border-surface-border pt-4">
                            <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <HandsClapping size={20} weight="fill" className="text-primary group-hover:text-white" />
                                I have this!
                            </Button>
                        </div>
                    </div>
                ))}
            </main>

        </div>
    );
}
