export type FileKind = "csv" | "tsv" | "json" | "jsonl" | "xml" | "xlsx" | "unknown";

export type TabularValue = string | number | boolean | null;

export type TabularRow = Record<string, TabularValue>;

export type ParsedData =
    | { kind: "tabular"; source: "csv" | "tsv" | "xlsx" | "jsonl"; rows: TabularRow[]; headers: string[] }
    | { kind: "json"; data: unknown }
    | { kind: "xml"; data: unknown; rootTag?: string }
    | { kind: "unknown"; raw: string; hint: string };

export interface MappingRule {
    original: string;
    remapped: string;
    /**
     * Jexl transform applied to the value before writing to target.
     * If empty, use raw value (or copy when remapped is empty for tabular).
     */
    transform?: string;
}

export type ExportFormat = "csv" | "tsv" | "json" | "jsonl" | "xml" | "yaml" | "xlsx";

export interface EtlOptions {
    trimWhitespace: boolean;
    /** When true, tabular remapping is case-insensitive for source column names */
    caseSensitive: boolean;
    /**
     * Jexl against full row. Empty = keep all rows. Example: c.Status == "active"
     * (see row filter docs). Tabular and JSONL only; ignored for free-form JSON.
     */
    tableRowFilter?: string;
    /** @deprecated use tableRowFilter; kept for compatibility */
    rowFilter?: string;
}

export const defaultEtlOptions: EtlOptions = {
    trimWhitespace: true,
    caseSensitive: false,
    tableRowFilter: "",
};
