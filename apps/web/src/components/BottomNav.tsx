"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, ListDashes, ChatCircleDots, User } from '@phosphor-icons/react';
import { cn } from '@peekpick/ui';

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/main/swipe', icon: House, label: 'Home' },
        { href: '/main/wishlist', icon: ListDashes, label: 'Wishlist' },
        { href: '/main/matches', icon: ChatCircleDots, label: 'Matches', badge: 2 }, // mocked badge
        { href: '/main/profile', icon: User, label: 'Profile' },
    ];

    // Don't show on non-main routes
    if (!pathname.startsWith('/main')) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-surface-border">
            <div className="flex justify-between items-center max-w-md mx-auto px-6 py-3 pb-8"> {/* pb padding for iOS safe area */}
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors relative",
                                isActive ? "text-primary" : "text-secondary hover:text-foreground"
                            )}
                        >
                            <div className="relative">
                                <Icon size={26} weight={isActive ? "fill" : "regular"} />
                                {item.badge && (
                                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-primary text-background text-[10px] font-bold flex items-center justify-center rounded-full border border-background">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
