"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@peekpick/ui';
import { CheckCircle } from 'lucide-react';
import { cn } from '@peekpick/ui';

const CATEGORIES = [
    { id: 'electronics', label: '📱 Electronics & Gadgets' },
    { id: 'clothing', label: '👕 Clothing & Accessories' },
    { id: 'books', label: '📚 Books & Stationery' },
    { id: 'home', label: '🏠 Home & Kitchen' },
    { id: 'toys', label: '🎮 Toys & Games' },
    { id: 'plants', label: '🌱 Plants & Garden' },
    { id: 'art', label: '🎨 Art & Handmade' },
    { id: 'tools', label: '🔧 Tools & Equipment' },
    { id: 'food', label: '🍳 Homemade Food' },
    { id: 'sports', label: '🏋️ Sports & Fitness' },
    { id: 'baby', label: '👶 Baby & Kids' },
    { id: 'beauty', label: '💄 Beauty & Care' }
];

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [haveItems, setHaveItems] = useState<string[]>([]);
    const [wantItems, setWantItems] = useState<string[]>([]);

    const toggleSelection = (id: string, list: string[], setList: (val: string[]) => void) => {
        if (list.includes(id)) {
            setList(list.filter(i => i !== id));
        } else {
            setList([...list, id]);
        }
    };

    const renderBubbleSelection = (list: string[], setList: (val: string[]) => void) => (
        <div className="flex flex-wrap gap-3 mt-6">
            {CATEGORIES.map(cat => {
                const isSelected = list.includes(cat.id);
                return (
                    <button
                        key={cat.id}
                        onClick={() => toggleSelection(cat.id, list, setList)}
                        className={cn(
                            "px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 transform",
                            isSelected
                                ? "bg-primary text-primary-foreground scale-105 shadow-elevated"
                                : "bg-surface-elevated text-secondary border border-surface-border hover:bg-surface-elevated/80"
                        )}
                    >
                        {cat.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-background px-4 py-8 relative pb-24">
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8 mt-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={cn("h-1.5 w-8 rounded-full", step >= i ? "bg-primary" : "bg-surface-elevated")} />
                ))}
            </div>

            <main className="flex-1 w-full max-w-sm mx-auto">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">What can you offer?</h1>
                        <p className="text-secondary text-base">Pick at least 3 categories. You can always change these later.</p>
                        {renderBubbleSelection(haveItems, setHaveItems)}
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">What do you want?</h1>
                        <p className="text-secondary text-base">This helps us find your perfect swaps.</p>
                        {renderBubbleSelection(wantItems, setWantItems)}
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-primary" weight="fill" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-4">Almost ready!</h1>
                        <p className="text-secondary text-base mb-8">
                            Now let's list your first item so you can start swiping and trading immediately.
                        </p>
                        <div className="bg-surface-elevated border border-surface-border rounded-xl p-6 text-left">
                            <h3 className="font-semibold text-white mb-1">Guided Upload</h3>
                            <p className="text-sm text-secondary mb-4 p-0">Takes 60 seconds.</p>
                            <Link href="/onboarding/upload" className="block w-full">
                                <Button className="w-full">Upload First Item</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Action footer */}
            {step < 3 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent flex justify-center max-w-md mx-auto">
                    <Button
                        className="w-full shadow-elevated"
                        size="lg"
                        onClick={() => setStep(step + 1)}
                        disabled={(step === 1 && haveItems.length < 3) || (step === 2 && wantItems.length < 3)}
                    >
                        {step === 1 && haveItems.length < 3 ? `Select ${3 - haveItems.length} more` :
                            step === 2 && wantItems.length < 3 ? `Select ${3 - wantItems.length} more` :
                                "Next"}
                    </Button>
                </div>
            )}
        </div>
    );
}
