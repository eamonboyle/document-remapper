import { Suspense } from "react";
import { RemapContent } from "./remap-content";

function RemapFallback() {
    return (
        <div
            className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
            aria-busy
        >
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand shadow-[0_0_12px_hsl(var(--brand)/0.6)]" />
            Preparing mapper…
        </div>
    );
}

export default function RemapPage() {
    return (
        <div className="flex min-h-[calc(100vh-3.375rem)] flex-col">
            <Suspense fallback={<RemapFallback />}>
                <RemapContent />
            </Suspense>
        </div>
    );
}
