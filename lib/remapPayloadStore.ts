const IDB = "DataRemapPayloads";
const STORE = "files";
const VERSION = 1;
const STALE_MS = 60 * 60 * 1000; // 1 hour

const SESSION_KEY = "data-remap-payload";

export type RemapSessionPayload =
    | { kind: "text"; fileName: string; text: string }
    | { kind: "binary"; fileName: string; base64: string };

const SMALL_SESSION_MAX = 1_200_000; // chars — stay under common 5MB session limit

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB, VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: "id" });
            }
        };
    });
}

export function randomKey(): string {
    return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export type StoreResult = { useUrlKey: true; key: string } | { useUrlKey: false };

/**
 * Persist handoff; uses sessionStorage for small payloads, IndexedDB for large.
 */
export async function saveRemapPayload(p: RemapSessionPayload): Promise<StoreResult> {
    if (typeof window === "undefined") {
        return { useUrlKey: false };
    }
    const asJson = JSON.stringify(p);
    if (asJson.length <= SMALL_SESSION_MAX) {
        try {
            sessionStorage.setItem(SESSION_KEY, asJson);
        } catch {
            return saveToIdb(p);
        }
        return { useUrlKey: false };
    }
    return saveToIdb(p);
}

async function saveToIdb(p: RemapSessionPayload): Promise<StoreResult> {
    const id = randomKey();
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const st = tx.objectStore(STORE);
        st.add({
            id,
            kind: p.kind,
            fileName: p.fileName,
            data: p.kind === "text" ? p.text : p.base64,
            createdAt: Date.now(),
        });
        tx.oncomplete = () => resolve({ useUrlKey: true, key: id });
        tx.onerror = () => reject(tx.error);
    });
}

export async function takeRemapPayload(keyFromUrl: string | null): Promise<RemapSessionPayload | null> {
    if (typeof window === "undefined") return null;
    if (keyFromUrl) {
        return takeFromIdbAndDelete(keyFromUrl);
    }
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_KEY);
    try {
        return JSON.parse(raw) as RemapSessionPayload;
    } catch {
        return null;
    }
}

async function takeFromIdbAndDelete(id: string): Promise<RemapSessionPayload | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const st = tx.objectStore(STORE);
        const req = st.get(id);
        req.onsuccess = () => {
            const row = req.result as
                | { id: string; kind: "text" | "binary"; fileName: string; data: string; createdAt: number }
                | undefined;
            st.delete(id);
            if (!row) {
                resolve(null);
                return;
            }
            if (Date.now() - row.createdAt > STALE_MS) {
                resolve(null);
                return;
            }
            if (row.kind === "text") {
                resolve({ kind: "text", fileName: row.fileName, text: row.data });
            } else {
                resolve({ kind: "binary", fileName: row.fileName, base64: row.data });
            }
        };
        req.onerror = () => reject(req.error);
    });
}
