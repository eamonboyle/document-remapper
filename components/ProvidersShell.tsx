import { AppHeader } from "@/components/AppHeader";

export function ProvidersShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
            {/* Ambient background */}
            <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
                <div className="absolute -left-[30%] top-[-20%] h-[min(65vw,50rem)] w-[min(85vw,54rem)] rounded-full bg-brand/[0.12] blur-[140px]" />
                <div className="absolute right-[-18%] top-[10%] h-[min(50vw,40rem)] w-[min(70vw,46rem)] rounded-full bg-[hsl(215_55%_42%_/_0.1)] blur-[120px]" />
                <div className="absolute bottom-[-25%] left-[25%] h-[min(55vw,42rem)] w-[min(90vw,50rem)] rounded-full bg-[hsl(190_45%_38%_/_0.07)] blur-[150px]" />
                <div className="noise-overlay absolute inset-0" />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.018]"
                    style={{
                        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                        backgroundSize: "80px 80px",
                    }}
                />
            </div>
            <AppHeader />
            <main className="relative flex-1">{children}</main>
        </div>
    );
}
