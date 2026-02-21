"use client";

import { motion } from 'framer-motion';
import { Button } from '@peekpick/ui';
import { SwipeItem } from './SwipeCard';
import Link from 'next/link';
import { ChatCircleText } from '@phosphor-icons/react';

interface MatchCelebrationProps {
    match: {
        me: SwipeItem;
        them: SwipeItem;
    };
    onClose: () => void;
}

export default function MatchCelebration({ match, onClose }: MatchCelebrationProps) {
    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 overflow-hidden">

            {/* Background Decor - Spotify Green Glow */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-background to-background pointer-events-none"
            />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

                <motion.h1
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="text-4xl font-extrabold text-primary mb-2 text-center italic"
                >
                    It's a Trade!
                </motion.h1>

                <motion.p
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white text-lg font-medium text-center mb-12"
                >
                    You and {match.them.ownerName} want to trade!
                </motion.p>

                {/* Colliding Avatars/Items Animation */}
                <div className="flex justify-center items-center gap-4 mb-16 relative">

                    <motion.div
                        initial={{ x: -100, opacity: 0, rotate: -20 }}
                        animate={{ x: 0, opacity: 1, rotate: -10 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.4 }}
                        className="w-32 h-40 rounded-xl overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(29,185,84,0.3)] bg-surface-elevated z-20 absolute -left-[70px]"
                    >
                        <img src={match.me.imageUrl} className="w-full h-full object-cover" alt="My Item" />
                    </motion.div>

                    {/* Sparkles Center Badge */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", delay: 0.6 }}
                        className="w-16 h-16 rounded-full bg-primary z-30 flex items-center justify-center border-4 border-background shadow-elevated"
                    >
                        <span className="text-2xl text-background font-bold tracking-tighter">⇄</span>
                    </motion.div>

                    <motion.div
                        initial={{ x: 100, opacity: 0, rotate: 20 }}
                        animate={{ x: 0, opacity: 1, rotate: 10 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.4 }}
                        className="w-32 h-40 rounded-xl overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(29,185,84,0.3)] bg-surface-elevated z-10 absolute -right-[70px]"
                    >
                        <img src={match.them.imageUrl} className="w-full h-full object-cover" alt="Their Item" />
                    </motion.div>
                </div>

                {/* Actions */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="w-full space-y-4"
                >
                    <Link href="/main/matches/1" className="block w-full">
                        <Button size="lg" className="w-full shadow-[0_0_20px_rgba(29,185,84,0.4)] flex items-center justify-center gap-2 font-bold text-lg">
                            <ChatCircleText size={24} weight="fill" />
                            Send a Message
                        </Button>
                    </Link>
                    <Button size="lg" variant="ghost" onClick={onClose} className="w-full tracking-wide">
                        Keep Swiping
                    </Button>
                </motion.div>

            </div>
        </div>
    );
}
