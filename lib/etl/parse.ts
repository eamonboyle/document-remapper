import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";
import * as XLSX from "xlsx";
import type { FileKind, ParsedData, TabularRow } from "./types";
import { detectKindFromName, detectKindFromTextSample } from "./detect";

function parseJson(text: string): unknown {
    return JSON.parse(text);
}

function parseJsonl(text: string): TabularRow[] {
    const lines = text.split(/\r?\n/);
    const rows: TabularRow[] = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const obj = JSON.parse(trimmed) as unknown;
        if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
            rows.push(obj as TabularRow);
        } else {
            throw new Error("JSON Lines rows must be JSON objects");
        }
    }
    return rows;
}

function tabularFromRows(rows: TabularRow[], headerOrder?: string[]): { headers: string[]; rows: TabularRow[] } {
    const set = new Set<string>();
    for (const r of rows) {
        Object.keys(r).forEach((k) => set.add(k));
    }
    const fromObj = Array.from(set);
    const headers = headerOrder?.length
        ? Array.from(new Set(headerOrder.concat(fromObj)))
        : fromObj;
    return { headers, rows };
}

export function parseTextContent(text: string, filename: string, kindOverride?: FileKind): ParsedData {
    const fromName = detectKindFromName(filename);
    const kind = kindOverride ?? (fromName !== "unknown" ? fromName : detectKindFromTextSample(text, filename));

    if (kind === "json") {
        try {
            return { kind: "json", data: parseJson(text) };
        } catch {
            return { kind: "unknown", raw: text, hint: "Could not parse as JSON" };
        }
    }

    if (kind === "jsonl") {
        try {
            const rows = parseJsonl(text);
            const { headers, rows: r } = tabularFromRows(rows);
            return { kind: "tabular", source: "jsonl", rows: r, headers };
        } catch (e) {
            const message = e instanceof Error ? e.message : "Invalid JSON Lines";
            return { kind: "unknown", raw: text, hint: message };
        }
    }

    if (kind === "csv" || kind === "tsv") {
        const result = Papa.parse<TabularRow>(text, {
            header: true,
            skipEmptyLines: "greedy",
            delimiter: kind === "tsv" ? "\t" : undefined,
        });
        if (result.errors.length) {
            const first = result.errors[0];
            return { kind: "unknown", raw: text, hint: first?.message ?? "CSV parse error" };
        }
        const rows = (result.data as TabularRow[]).filter((r) => Object.keys(r).some((k) => String(r[k] ?? "").trim() !== ""));
        const headers = result.meta.fields?.filter(Boolean) as string[] | undefined;
        if (!rows.length) {
            return { kind: "unknown", raw: text, hint: "No data rows" };
        }
        const h = headers?.length ? headers : Object.keys(rows[0]);
        return { kind: "tabular", source: kind, rows, headers: h };
    }

    if (kind === "xml") {
        try {
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: "@_",
                textNodeName: "#text",
            });
            const data = parser.parse(text);
            return { kind: "xml", data };
        } catch (e) {
            const message = e instanceof Error ? e.message : "XML parse error";
            return { kind: "unknown", raw: text, hint: message };
        }
    }

    return { kind: "unknown", raw: text, hint: "Unsupported or ambiguous format. Try JSON, CSV, TSV, XML, XLSX, or JSON Lines." };
}

export function parseArrayBuffer(buffer: ArrayBuffer, filename: string): ParsedData {
    const kind = detectKindFromName(filename);
    if (kind === "xlsx" || kind === "unknown") {
        if (filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls")) {
            return parseXlsxArrayBuffer(buffer);
        }
    }
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const text = decoder.decode(buffer);
    return parseTextContent(text, filename, kind === "xlsx" ? "xlsx" : undefined);
}

function parseXlsxArrayBuffer(buffer: ArrayBuffer): ParsedData {
    try {
        const wb = XLSX.read(buffer, { type: "array" });
        const name = wb.SheetNames[0];
        if (!name) {
            return { kind: "unknown", raw: "", hint: "Excel workbook has no sheets" };
        }
        const sheet = wb.Sheets[name];
        const matrix = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
            raw: false,
        }) as unknown as (string | number | boolean)[][];

        if (!matrix.length) {
            return { kind: "unknown", raw: "", hint: "Empty sheet" };
        }
        const headerRow = matrix[0].map((c, i) => {
            const t = String(c ?? "").trim();
            return t || `col_${i + 1}`;
        });
        const rows: TabularRow[] = [];
        for (let i = 1; i < matrix.length; i++) {
            const line = matrix[i];
            const row: TabularRow = {};
            let hasValue = false;
            for (let c = 0; c < headerRow.length; c++) {
                const key = headerRow[c];
                const v = line[c];
                if (v === "" || v === undefined || v === null) {
                    row[key] = null;
                } else if (typeof v === "number" || typeof v === "boolean") {
                    row[key] = v;
                    hasValue = true;
                } else {
                    const s = String(v);
                    row[key] = s;
                    if (s.trim() !== "") hasValue = true;
                }
            }
            if (hasValue) rows.push(row);
        }
        return { kind: "tabular", source: "xlsx", rows, headers: headerRow };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Excel read error";
        return { kind: "unknown", raw: "", hint: message };
    }
}
