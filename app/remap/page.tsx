import { Suspense } from "react";
import { RemapContent } from "./remap-content";
import { Map } from "lucide-react";

function RemapFallback() {
    return (
        <div
            className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-6 py-12 text-sm text-muted-foreground backdrop-blur-sm"
            aria-busy
        >
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand shadow-[0_0_12px_hsl(var(--brand)/0.6)]" />
            Preparing mapper…
        </div>
    );
}

export default function RemapPage() {
    return (
        <div className="container max-w-6xl px-4 py-10 sm:py-12">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/25">
                        <Map className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Editor</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Map &amp; export</h1>
                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                            Rename fields, adjust paths, preview the target format, then download.
                        </p>
                    </div>
                </div>
            </div>
            <Suspense fallback={<RemapFallback />}>
                <RemapContent />
            </Suspense>
        </div>
    );
}
