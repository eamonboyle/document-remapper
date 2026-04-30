import { AppHeader } from "@/components/AppHeader";

export function ProvidersShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
            <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
                <div className="absolute -left-[35%] top-[-25%] h-[min(70vw,52rem)] w-[min(90vw,56rem)] rounded-full bg-brand/20 blur-[120px]" />
                <div className="absolute right-[-20%] top-[15%] h-[min(55vw,42rem)] w-[min(75vw,48rem)] rounded-full bg-[hsl(215_55%_42%_/_0.18)] blur-[100px]" />
                <div className="absolute bottom-[-30%] left-[20%] h-[min(60vw,44rem)] w-[min(95vw,52rem)] rounded-full bg-[hsl(190_45%_38%_/_0.12)] blur-[130px]" />
                <div className="noise-overlay absolute inset-0" />
            </div>
            <AppHeader />
            <main className="relative flex-1">{children}</main>
        </div>
    );
}
