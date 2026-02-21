"use client";

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SwipeCard, SwipeItem } from '@/components/SwipeCard';
import { Button } from '@peekpick/ui';
import { ArrowUUpLeft, Compass, X, Heart, Star } from '@phosphor-icons/react';
import Link from 'next/link';
import MatchCelebration from '@/components/MatchCelebration';

const MOCK_STACK: SwipeItem[] = [
    { id: '1', title: 'Fender Stratocaster', condition: 'Gently Used', imageUrl: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?q=80&w=600', ownerName: 'Carlos M.', distance: '2.4 km', rating: 4.8 },
    { id: '2', title: 'Nintendo Switch OLED', condition: 'Like New', imageUrl: 'https://images.unsplash.com/photo-1612053073739-1ff5734e5699?q=80&w=600', ownerName: 'Aria S.', distance: '5.1 km', rating: 4.9 },
    { id: '3', title: 'Monstera Deliciosa (Large)', condition: 'Brand New', imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d40?q=80&w=600', ownerName: 'Leo T.', distance: '1.2 km', rating: 5.0 },
];

export default function SwipeFeed() {
    const [items, setItems] = useState(MOCK_STACK);
    const [mode, setMode] = useState<'For You' | 'Open to Offers'>('For You');
    const [showMatch, setShowMatch] = useState<{ me: SwipeItem, them: SwipeItem } | null>(null);

    const handleSwipe = (id: string, direction: 'left' | 'right' | 'super') => {
        // Save reference in case it's a match
        const swipedItem = items.find(i => i.id === id);

        // Remove from stack
        setItems(prev => prev.filter(i => i.id !== id));

        // Mock match trigger (If right swipe on Switch OLED)
        if ((direction === 'right' || direction === 'super') && swipedItem?.title.includes('Nintendo')) {
            setShowMatch({
                them: swipedItem,
                me: { id: '0', title: 'My Old iPhone', condition: 'Gently Used', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', ownerName: 'Me', distance: '0km', rating: 5.0 }
            });
        }
    };

    const handleManualAction = (direction: 'left' | 'right' | 'super') => {
        if (items.length > 0) {
            handleSwipe(items[items.length - 1].id, direction);
        }
    };

    // If match overlay is visible, block rendering stack
    if (showMatch) {
        return <MatchCelebration match={showMatch} onClose={() => setShowMatch(null)} />;
    }

    return (
        <div className="flex flex-col h-screen bg-background relative overflow-hidden">

            {/* Top Navigation & Toggles */}
            <header className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-background to-transparent z-40 flex items-center justify-between px-6 pt-4">
                {/* Undo Action Placeholder */}
                <button className="w-10 h-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-secondary hover:text-foreground">
                    <ArrowUUpLeft weight="bold" />
                </button>

                {/* Mode Toggle */}
                <div className="flex bg-surface-elevated rounded-full p-1 border border-surface-border shadow-elevated">
                    <button
                        onClick={() => setMode('For You')}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'For You' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                        For You
                    </button>
                    <button
                        onClick={() => setMode('Open to Offers')}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-1 ${mode === 'Open to Offers' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                        Open to Offers
                    </button>
                </div>
                <div className="w-10 h-10" /> {/* Balancer */}
            </header>

            {/* Stack Container */}
            <main className="flex-1 w-full max-w-md mx-auto relative px-4 flex items-center justify-center pt-10 pb-28">
                {items.length === 0 ? (
                    <div className="text-center space-y-4 px-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 mx-auto rounded-full bg-surface-elevated flex items-center justify-center border border-surface-border">
                            <Compass size={40} className="text-secondary" weight="duotone" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">You've seen everything nearby.</h2>
                        <p className="text-secondary">Try expanding your trade radius or check the Wishlist Board to request something specific.</p>
                        <Link href="/main/wishlist" className="block w-full pt-4">
                            <Button size="lg" variant="secondary" className="w-[80%] mx-auto">Go to Wishlist Board</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center perspective-[1000px]">
                        <AnimatePresence>
                            {/* Render stack items. Z-index reverse calculation implicitly handled by order, but we enforce via Framer Motion zIndex in the card */}
                            {items.map((item, index) => (
                                <SwipeCard
                                    key={item.id}
                                    item={item}
                                    isActive={index === items.length - 1}
                                    onSwipe={handleSwipe}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Action Buttons Container (Thumb zone) */}
            <footer className="absolute bottom-6 inset-x-0 w-full max-w-md mx-auto px-10 flex justify-between items-center z-40 bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pb-4">
                {/* Pass Button */}
                <button
                    onClick={() => handleManualAction('left')}
                    disabled={items.length === 0}
                    className="w-16 h-16 rounded-full border border-destructive bg-surface-elevated shadow-elevated flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                    <X size={32} weight="bold" />
                </button>

                {/* Super Swap Button */}
                <button
                    onClick={() => handleManualAction('super')}
                    disabled={items.length === 0}
                    className="w-12 h-12 mb-4 rounded-full border border-primary bg-surface-elevated shadow-elevated flex items-center justify-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 relative group"
                >
                    <Star size={24} weight="fill" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-primary items-center justify-center text-[9px] font-bold text-background border-2 border-surface-elevated">1</span>
                </button>

                {/* Want Button */}
                <button
                    onClick={() => handleManualAction('right')}
                    disabled={items.length === 0}
                    className="w-16 h-16 rounded-full bg-primary shadow-[0_0_20px_rgba(29,185,84,0.4)] flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform disabled:opacity-50"
                >
                    <Heart size={32} weight="fill" />
                </button>
            </footer>
        </div>
    );
}
