import { BottomNav } from '@/components/BottomNav';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background relative w-full h-full">
            <main className="flex-1 w-full flex flex-col pt-safe-top pb-[88px] relative z-10">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
