import type { EtlOptions, ExportFormat, MappingRule, ParsedData } from "./types";
import { defaultEtlOptions } from "./types";
import { exportData } from "./remap";

const MAX_PREVIEW = 80_000;

export function buildPreview(
    parsed: ParsedData,
    mappings: MappingRule[],
    format: ExportFormat,
    options: EtlOptions = defaultEtlOptions
): string {
    try {
        const out = exportData(parsed, mappings, format, options);
        if (out.binary) {
            return "Binary output (Excel). Use Download to save the file.";
        }
        const c = out.content;
        if (c.length <= MAX_PREVIEW) return c;
        return c.slice(0, MAX_PREVIEW) + "\n\n… [preview truncated]";
    } catch (e) {
        const message = e instanceof Error ? e.message : "Preview failed";
        return `Preview unavailable: ${message}`;
    }
}
