"use client";

import Link from 'next/link';
import { Button } from '@peekpick/ui';
import { motion } from 'framer-motion';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">

            {/* Background Glow Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="px-6 py-8 flex items-center justify-between z-10 relative">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(29,185,84,0.4)]">
                        <span className="text-background font-bold text-2xl leading-none tracking-tighter -mr-0.5 mt-0.5">P</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">PeekPick</h1>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="font-semibold text-secondary hover:text-white">Log In</Button>
                    </Link>
                </motion.div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center px-6 pt-10 pb-20 z-10 relative">

                {/* Typographic Hero */}
                <div className="space-y-6 text-center max-w-sm mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated/50 backdrop-blur-md border border-surface-border text-xs font-semibold text-primary mb-2 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Beta Live in Metro Manila
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-[3.2rem] sm:text-6xl font-black tracking-tighter leading-[1.05] text-transparent bg-clip-text bg-gradient-to-br from-white via-white/95 to-white/60"
                    >
                        Swap what you have for <span className="text-primary bg-none bg-transparent block mt-1 drop-shadow-[0_0_20px_rgba(29,185,84,0.4)]">what you need.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-secondary text-base font-medium max-w-sm mx-auto leading-relaxed px-4"
                    >
                        No money. Just community. Join Southeast Asia's first swipe-based digital barter marketplace.
                    </motion.p>
                </div>

                {/* Dynamic Card Stack Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 25 }}
                    className="relative w-full max-w-[280px] h-[340px] mx-auto mt-12 perspective-[1000px] mb-8"
                >
                    {/* Back Card */}
                    <div className="absolute inset-x-6 top-0 bottom-0 bg-surface-elevated rounded-[32px] transform -translate-y-8 border border-surface-border/30 shadow-2xl opacity-40 origin-bottom" />

                    {/* Middle Card */}
                    <div className="absolute inset-x-3 top-0 bottom-0 bg-surface-elevated rounded-[32px] transform -translate-y-4 border border-surface-border/50 shadow-2xl opacity-70 origin-bottom" />

                    {/* Front Card */}
                    <div className="absolute inset-0 bg-surface-elevated rounded-[32px] overflow-hidden border border-surface-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 group">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
                        <img
                            src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=600"
                            alt="Premium Headphones"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Overlay UI */}
                        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col p-6">
                            <h3 className="text-2xl font-extrabold text-white leading-tight mb-3 tracking-tight">Sony WH-1000XM4</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-background bg-primary px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(29,185,84,0.3)]">Like New</span>
                                <span className="text-xs font-semibold text-secondary flex items-center gap-1">📍 2.4 km away</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating Interaction Badges */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute -right-8 top-16 z-30 bg-surface-elevated/90 backdrop-blur-xl border border-surface-border/60 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg shadow-inner">✨</div>
                        <div>
                            <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-0.5">Matched With</p>
                            <p className="text-sm font-bold text-white tracking-tight">Your iPhone 12</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-[280px] mt-auto relative z-20"
                >
                    <Link href="/register" className="w-full block group">
                        <Button size="lg" className="w-full text-lg font-bold shadow-[0_4px_20px_rgba(29,185,84,0.3)] group-hover:shadow-[0_4px_30px_rgba(29,185,84,0.5)] transition-all h-14 rounded-full">
                            Join the Beta
                        </Button>
                    </Link>
                </motion.div>
            </main>
        </div>
    );
}
