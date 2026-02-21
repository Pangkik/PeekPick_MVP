"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button, cn } from '@peekpick/ui';

export default function ItemUpload() {
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [condition, setCondition] = useState('');

    return (
        <div className="flex flex-col min-h-screen bg-background p-6 pb-24 relative">
            <header className="mb-8 pt-4">
                <div className="flex justify-between items-center text-secondary text-sm">
                    <span>{step} / 4</span>
                    <Link href="/main/swipe" className="hover:text-foreground">Skip for now</Link>
                </div>
                <div className="h-1 bg-surface-elevated rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
                </div>
            </header>

            <main className="flex-1 w-full max-w-sm mx-auto">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Snap a photo</h1>
                        <p className="text-secondary mb-8">Good lighting guarantees more matches.</p>

                        <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-surface-border bg-surface flex flex-col items-center justify-center text-secondary hover:border-primary hover:text-primary transition-colors cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4 group-hover:bg-primary/20">
                                <span className="text-2xl">📸</span>
                            </div>
                            <span className="font-medium">Tap to upload photos</span>
                        </div>

                        <Button size="lg" className="w-full mt-8 shadow-elevated" onClick={() => setStep(2)}>Next</Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">What is it?</h1>
                            <p className="text-secondary mb-6">Give it a short, punchy title.</p>

                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-4 py-4 text-foreground text-lg font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="e.g., iPhone 13 Pro Max"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-3">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-4 py-4 text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                            >
                                <option value="" disabled>Select a category</option>
                                <option value="electronics">📱 Electronics</option>
                                <option value="clothing">👕 Clothing</option>
                                <option value="books">📚 Books</option>
                            </select>
                        </div>

                        <Button
                            size="lg"
                            className="w-full mt-8 !mt-12"
                            disabled={!title || !category}
                            onClick={() => setStep(3)}
                        >
                            Next
                        </Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h1 className="text-3xl font-bold tracking-tight mb-6">What condition is it in?</h1>

                        <div className="space-y-3">
                            {['Brand New', 'Like New', 'Gently Used', 'Well-Loved'].map(cond => (
                                <button
                                    key={cond}
                                    onClick={() => setCondition(cond)}
                                    className={cn(
                                        "w-full text-left px-5 py-4 rounded-xl border transition-all",
                                        condition === cond
                                            ? "bg-primary/10 border-primary text-primary font-medium"
                                            : "bg-surface border-surface-border text-foreground hover:bg-surface-elevated"
                                    )}
                                >
                                    {cond}
                                </button>
                            ))}
                        </div>

                        <Button size="lg" className="w-full mt-10" disabled={!condition} onClick={() => setStep(4)}>Next</Button>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Almost done.</h1>
                        <p className="text-secondary mb-6">Add a quick description highlighting any flaws or reasons for trading.</p>

                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full h-40 bg-surface-elevated border border-surface-border rounded-xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                            placeholder="Has a tiny scratch on the back, but works perfectly. Looking to trade for a camera lens."
                        />

                        <Link href="/main/swipe" className="block w-full mt-8">
                            <Button size="lg" className="w-full shadow-elevated">Publish & Start Swiping</Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
