import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const formats = [
    { name: "JSON", note: "Arrays or objects; good for APIs and archives." },
    { name: "CSV / TSV", note: "Tabular exports; matches spreadsheet analysis workflows." },
    { name: "JSON Lines", note: "One object per line; good for log-style or streaming inputs." },
    { name: "YAML", note: "Human-readable; useful for config-shaped outputs." },
    { name: "XML", note: "Vendor feeds and legacy systems; first sheet row becomes rows in tabular mode." },
    { name: "Excel (.xlsx)", note: "From tabular or JSON object arrays; binary download." },
];

export function ExportOptions() {
    return (
        <div className="space-y-8">
            <ul className="grid gap-3 sm:grid-cols-2">
                {formats.map((f) => (
                    <li
                        key={f.name}
                        className="flex gap-3 rounded-xl border border-border/60 bg-card/40 p-4 ring-1 ring-white/[0.03] backdrop-blur-sm"
                    >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="font-medium text-foreground">{f.name}</p>
                            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{f.note}</p>
                        </div>
                    </li>
                ))}
            </ul>
            <div className="rounded-2xl border border-border/60 bg-muted/25 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                Mappings are saved as JSON (Load / Save mapping on the map screen) so you can reapply the same vendor-to-internal field map
                on every import run.
            </div>
            <Button size="lg" className="rounded-xl" asChild>
                <Link href="/">Start mapping a file</Link>
            </Button>
        </div>
    );
}
