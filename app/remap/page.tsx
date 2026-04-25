import { Suspense } from "react";
import { RemapContent } from "./remap-content";

function RemapFallback() {
    return (
        <div className="min-h-[40vh] text-muted-foreground" aria-busy>
            Preparing…
        </div>
    );
}

export default function RemapPage() {
    return (
        <div className="container max-w-6xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold tracking-tight">Map &amp; export</h1>
            <Suspense fallback={<RemapFallback />}>
                <RemapContent />
            </Suspense>
        </div>
    );
}
