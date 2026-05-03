import { ExportOptions } from "@/components/ExportOptions";
import { FileOutput } from "lucide-react";

export default function ExportPage() {
    return (
        <div className="container max-w-3xl px-4 py-12 sm:py-16">
            <div className="mb-8 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border/70">
                    <FileOutput className="h-6 w-6" aria-hidden />
                </span>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Reference</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Export &amp; formats</h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        After mapping, pick a target in the mapper. This page summarizes what you can produce.
                    </p>
                </div>
            </div>
            <ExportOptions />
        </div>
    );
}
