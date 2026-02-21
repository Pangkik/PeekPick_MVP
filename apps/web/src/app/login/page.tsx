"use client";

import Link from 'next/link';
import { Button } from '@peekpick/ui';

export default function Login() {
    return (
        <div className="flex flex-col min-h-screen bg-background p-6">
            <header className="mb-10 pt-4">
                <Link href="/" className="text-secondary text-sm flex items-center gap-2 hover:text-foreground transition-colors">
                    ← Back
                </Link>
            </header>

            <main className="flex-1 w-full max-w-sm mx-auto">
                <div className="space-y-2 mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                    <p className="text-secondary">Sign in to manage your trades.</p>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="juan@student.edu.ph"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Link href="/main/swipe" className="block w-full">
                        <Button size="lg" className="w-full font-bold">Log In</Button>
                    </Link>

                    <div className="text-center mt-6">
                        <p className="text-secondary text-sm">
                            Don't have an account? <Link href="/register" className="text-primary hover:underline">Sign up</Link>
                        </p>
                    </div>
                </form>
            </main>
        </div>
    );
}
