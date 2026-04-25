import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-6">
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                {formats.map((f) => (
                    <li key={f.name}>
                        <strong className="text-foreground font-medium">{f.name}:</strong> {f.note}
                    </li>
                ))}
            </ul>
            <p className="text-sm text-muted-foreground">
                Mappings are saved as JSON (Load / Save mapping on the map screen) so you can reapply the same vendor-to-internal field map
                on every import run.
            </p>
            <Button asChild>
                <Link href="/">Start mapping a file</Link>
            </Button>
        </div>
    );
}
