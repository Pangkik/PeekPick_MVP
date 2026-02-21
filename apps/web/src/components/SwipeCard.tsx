"use client";

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Star, X, Heart } from 'lucide-react';
import { cn } from '@peekpick/ui';

export interface SwipeItem {
    id: string;
    title: string;
    condition: string;
    imageUrl: string;
    ownerName: string;
    distance: string;
    rating: number;
}

interface SwipeCardProps {
    item: SwipeItem;
    isActive: boolean;
    onSwipe: (id: string, direction: 'left' | 'right' | 'super') => void;
}

export function SwipeCard({ item, isActive, onSwipe }: SwipeCardProps) {
    const x = useMotionValue(0);

    // Transform x position into rotation (subtle to match tinder spring physics)
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    // Transform x into opacity for right/left action badges
    const opacityRight = useTransform(x, [0, 100], [0, 1]);
    const opacityLeft = useTransform(x, [0, -100], [0, 1]);
    const colorBg = useTransform(x, [-200, 0, 200], ['rgba(229, 75, 75, 0.4)', 'rgba(0, 0, 0, 0)', 'rgba(29, 185, 84, 0.4)']);

    const handleDragEnd = (_, info: any) => {
        if (info.offset.x > 100) onSwipe(item.id, 'right');
        else if (info.offset.x < -100) onSwipe(item.id, 'left');
        else x.set(0); // Snap back
    };

    return (
        <motion.div
            style={isActive ? { x, rotate } : undefined}
            drag={isActive ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            viewport={{ once: true }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: isActive ? 1 : 0.95, opacity: 1, zIndex: isActive ? 10 : 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "absolute inset-0 w-full h-[75vh] md:h-[80vh] bg-surface-elevated rounded-[24px] shadow-elevated origin-bottom overflow-hidden border border-surface-border",
                !isActive && "pointer-events-none mt-4"
            )}
        >
            {/* Background Image */}
            <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />

            {/* Swipe Feedback Overlay */}
            <motion.div style={{ backgroundColor: colorBg }} className="absolute inset-0 z-10 pointer-events-none" />

            {/* Action Badges */}
            {isActive && (
                <>
                    <motion.div style={{ opacity: opacityRight }} className="absolute top-10 left-8 z-20 border-4 border-primary text-primary font-bold text-3xl px-4 py-2 rounded-lg transform -rotate-12 bg-black/40">
                        WANT
                    </motion.div>
                    <motion.div style={{ opacity: opacityLeft }} className="absolute top-10 right-8 z-20 border-4 border-destructive text-destructive font-bold text-3xl px-4 py-2 rounded-lg transform rotate-12 bg-black/40">
                        PASS
                    </motion.div>
                </>
            )}

            {/* Item Details Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end px-6 pb-8 z-20 pt-16">
                <div className="w-full">
                    <div className="flex justify-between items-end mb-1">
                        <h2 className="text-3xl font-extrabold text-white leading-tight">{item.title}</h2>
                    </div>
                    <p className="text-sm font-semibold text-primary border border-primary/40 bg-primary/10 rounded-full px-3 py-1 inline-block mb-3">
                        {item.condition}
                    </p>
                    <div className="flex items-center gap-2 text-secondary text-sm font-medium">
                        <span>{item.ownerName}</span>
                        <span>•</span>
                        <span className="flex items-center"><Star className="w-3 h-3 text-pending mr-1" weight="fill" /> {item.rating}</span>
                        <span>•</span>
                        <span>{item.distance} away</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
