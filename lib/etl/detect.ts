import type { FileKind } from "./types";

const JSON_START = /^\s*[\[{]/;
const JSONL_LINE = /^\s*\{.*\}\s*$/;
const XML_DECL = /^\s*<\?xml/i;
const HTML_LIKE = /^\s*<(!DOCTYPE|html|HTML)/i;

export function detectKindFromName(filename: string): FileKind {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".csv")) return "csv";
    if (lower.endsWith(".tsv") || lower.endsWith(".tab")) return "tsv";
    if (lower.endsWith(".json")) return "json";
    if (lower.endsWith(".jsonl") || lower.endsWith(".ndjson")) return "jsonl";
    if (lower.endsWith(".xml")) return "xml";
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
    return "unknown";
}

/**
 * Heuristic when MIME/extension is ambiguous (e.g. .txt, missing extension).
 */
export function detectKindFromTextSample(text: string, filenameHint: string): FileKind {
    const fromName = detectKindFromName(filenameHint);
    if (fromName !== "unknown" && fromName !== "json") {
        // Name wins for structured except json (often mis-labeled)
        if (fromName === "xml" && !XML_DECL.test(text) && !text.trim().startsWith("<")) {
            // might be wrong extension
        } else {
            return fromName;
        }
    }

    const t = text.slice(0, Math.min(4096, text.length));
    if (XML_DECL.test(t) || (t.trim().startsWith("<") && !HTML_LIKE.test(t))) {
        return "xml";
    }
    if (JSON_START.test(t)) {
        return "json";
    }
    const firstLine = t.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
    if (firstLine.includes("\t") && !firstLine.includes(",")) {
        return "tsv";
    }
    if (firstLine.split(",").length > 1) {
        return "csv";
    }
    if (t.split("\n").slice(0, 3).every((line) => !line.trim() || JSONL_LINE.test(line))) {
        return "jsonl";
    }
    return "unknown";
}
