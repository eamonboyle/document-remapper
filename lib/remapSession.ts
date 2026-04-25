const KEY = "data-remap-payload";

export type RemapSessionPayload =
    | { kind: "text"; fileName: string; text: string }
    | { kind: "binary"; fileName: string; base64: string };

const MAX_B64 = 4 * 1024 * 1024; // ~3MB file after encoding — avoid quota issues

export function setRemapSession(p: RemapSessionPayload): void {
    if (p.kind === "binary" && p.base64.length > MAX_B64) {
        throw new Error("File is too large to pass in-browser. Use “Replace file” on the map screen or cloud upload.");
    }
    if (p.kind === "text" && p.text.length > 5 * 1024 * 1024) {
        throw new Error("File is very large. Use “Replace file” on the map screen or cloud upload.");
    }
    sessionStorage.setItem(KEY, JSON.stringify(p));
}

export function takeRemapSession(): RemapSessionPayload | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    try {
        return JSON.parse(raw) as RemapSessionPayload;
    } catch {
        return null;
    }
}
