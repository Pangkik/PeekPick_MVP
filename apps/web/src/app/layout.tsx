import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PeekPick | Swap what you have for what you need.',
    description: 'A swipe-based digital barter marketplace rooted in the circular economy and community exchange.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen flex flex-col`}>
                {/* We will inject a dynamic Bottom Navigation Bar later for authenticated routes */}
                <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto sm:border-x sm:border-surface-border">
                    {children}
                </main>
            </body>
        </html>
    );
}
