const KEY = "data-remap-payload";

/** Same cap as the home page local picker (raw bytes). Base64 expands by ~4/3. */
const MAX_LOCAL_BINARY_BYTES = 4 * 1024 * 1024;

function maxBase64CharsForBytes(byteLength: number): number {
    return 4 * Math.ceil(byteLength / 3);
}

export type RemapSessionPayload =
    | { kind: "text"; fileName: string; text: string }
    | { kind: "binary"; fileName: string; base64: string };

export function setRemapSession(p: RemapSessionPayload): void {
    if (p.kind === "binary" && p.base64.length > maxBase64CharsForBytes(MAX_LOCAL_BINARY_BYTES)) {
        throw new Error("File is too large to pass in-browser. Use “Replace file” on the map screen or cloud upload.");
    }
    if (p.kind === "text" && p.text.length > 5 * 1024 * 1024) {
        throw new Error("File is very large. Use “Replace file” on the map screen or cloud upload.");
    }
    sessionStorage.setItem(KEY, JSON.stringify(p));
}

/**
 * Read the pending local file payload without removing it.
 * (A consuming read breaks in React Strict Mode dev, where effects run twice.)
 * New picks from the home page overwrite this key via setRemapSession.
 */
export function getRemapSession(): RemapSessionPayload | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as RemapSessionPayload;
    } catch {
        return null;
    }
}
