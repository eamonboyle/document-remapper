import { ExportOptions } from "@/components/ExportOptions";

export default function ExportPage() {
    return (
        <div className="container max-w-3xl px-4 py-8">
            <h1 className="mb-2 text-2xl font-bold">Export &amp; formats</h1>
            <p className="text-muted-foreground mb-6 text-sm">
                After mapping, pick a target in the mapper. This page summarizes what you can produce.
            </p>
            <ExportOptions />
        </div>
    );
}
