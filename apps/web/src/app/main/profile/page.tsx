"use client";

import Link from 'next/link';
import { Button } from '@peekpick/ui';
import { Gear, Star, UploadSimple, MapPin } from '@phosphor-icons/react';
import { cn } from '@peekpick/ui';

const MOCK_PROFILE = {
    name: "Juan dela Cruz",
    avatar: 'https://i.pravatar.cc/150?u=10',
    bio: "Looking to declutter my tech and pick up more gardening supplies. Based in QC.",
    city: "Quezon City",
    rating: 4.9,
    trades: 12,
    memberSince: "Oct 2025"
};

const MOCK_MY_ITEMS = [
    { id: '1', title: 'Arduino Uno Base Kit', status: 'Active', imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200' },
    { id: '2', title: 'The Lean Startup (Book)', status: 'Traded', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200' },
    { id: '3', title: 'Unused Gym Bag', status: 'Paused', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200' },
];

export default function Profile() {
    return (
        <div className="flex flex-col min-h-screen bg-background p-6">

            {/* Header */}
            <header className="flex justify-between items-center mb-6 pt-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
                <button className="w-10 h-10 bg-surface-elevated text-secondary rounded-full flex items-center justify-center hover:text-foreground hover:bg-surface-border transition-colors">
                    <Gear size={24} weight="bold" />
                </button>
            </header>

            <main className="flex-1 space-y-8 pb-4">

                {/* Profile Card */}
                <div className="bg-surface-elevated rounded-3xl p-6 border border-surface-border shadow-elevated">
                    <div className="flex flex-col items-center text-center">
                        <img src={MOCK_PROFILE.avatar} alt={MOCK_PROFILE.name} className="w-24 h-24 rounded-full border-4 border-background mb-4 shadow-xl" />
                        <h2 className="text-2xl font-bold text-foreground mb-1">{MOCK_PROFILE.name}</h2>
                        <div className="flex items-center gap-1.5 text-secondary text-sm font-medium mb-4">
                            <MapPin size={16} /> {MOCK_PROFILE.city}
                            <span className="opacity-50 mx-1">•</span>
                            Member since {MOCK_PROFILE.memberSince}
                        </div>
                        <p className="text-secondary text-sm max-w-[280px] leading-relaxed mb-6">"{MOCK_PROFILE.bio}"</p>

                        {/* Stats Row */}
                        <div className="flex justify-center gap-8 w-full border-t border-surface-border pt-6">
                            <div className="text-center">
                                <p className="text-xl font-bold flex items-center justify-center gap-1">
                                    <Star size={18} weight="fill" className="text-pending" /> {MOCK_PROFILE.rating}
                                </p>
                                <p className="text-xs text-secondary uppercase tracking-wider font-semibold mt-1">Avg Rating</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold">{MOCK_PROFILE.trades}</p>
                                <p className="text-xs text-secondary uppercase tracking-wider font-semibold mt-1">Trades</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Items Grid */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h3 className="text-xl font-bold tracking-tight">My Items</h3>
                        <Link href="/onboarding/upload" className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
                            <UploadSimple size={16} weight="bold" /> New Item
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {MOCK_MY_ITEMS.map(item => (
                            <div key={item.id} className="bg-surface-elevated rounded-2xl overflow-hidden border border-surface-border relative group">
                                <div className="aspect-[4/5] relative">
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* Status Badge */}
                                <span className={cn(
                                    "absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase shadow-md backdrop-blur-md",
                                    item.status === 'Active' ? 'bg-primary/20 text-primary border border-primary/30' :
                                        item.status === 'Traded' ? 'bg-secondary/20 text-secondary border border-secondary/30' :
                                            'bg-surface border border-surface-border text-secondary'
                                )}>
                                    {item.status}
                                </span>

                                <div className="absolute bottom-0 inset-x-0 p-3">
                                    <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                                </div>
                            </div>
                        ))}

                        <Link href="/onboarding/upload" className="bg-surface-elevated border-2 border-dashed border-surface-border rounded-2xl flex flex-col items-center justify-center text-secondary hover:text-primary hover:border-primary/50 transition-colors gap-2 min-h-[160px]">
                            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                                <Plus size={20} weight="bold" />
                            </div>
                            <span className="text-sm font-medium tracking-wide">Add Item</span>
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}

// Ensure icon is imported locally
import { Plus } from '@phosphor-icons/react';
