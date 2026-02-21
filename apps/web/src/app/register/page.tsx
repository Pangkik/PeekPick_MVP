"use client";

import Link from 'next/link';
import { Button } from '@peekpick/ui';

export default function Register() {
    return (
        <div className="flex flex-col min-h-screen bg-background p-6">
            <header className="mb-10 pt-4">
                <Link href="/" className="text-secondary text-sm flex items-center gap-2 hover:text-foreground transition-colors">
                    ← Back
                </Link>
            </header>

            <main className="flex-1 w-full max-w-sm mx-auto">
                <div className="space-y-2 mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
                    <p className="text-secondary">Join the PeekPick community.</p>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Juan dela Cruz"
                            />
                        </div>
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

                    <Link href="/onboarding" className="block w-full">
                        <Button size="lg" className="w-full font-bold">Sign Up</Button>
                    </Link>

                    <div className="text-center mt-6">
                        <p className="text-secondary text-sm">
                            Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
                        </p>
                    </div>
                </form>
            </main>
        </div>
    );
}
