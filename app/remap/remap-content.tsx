"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataMapper } from "@/components/DataMapper";
import { Loader2 } from "lucide-react";
import { takeRemapPayload } from "@/lib/remapPayloadStore";
import type { ParsedData } from "@/lib/etl";
import { parseArrayBuffer } from "@/lib/etl";

function base64ToArrayBuffer(b64: string): ArrayBuffer {
    const binary = atob(b64);
    const len = binary.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        out[i] = binary.charCodeAt(i);
    }
    return out.buffer;
}

export function RemapContent() {
    const searchParams = useSearchParams();
    const fileUrl = searchParams.get("fileUrl");
    const nameParam = searchParams.get("name");
    const isLocal = searchParams.get("source") === "local";
    const idbKey = searchParams.get("key");

    const [text, setText] = useState<string | null>(null);
    const [label, setLabel] = useState(nameParam || "document");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(!!fileUrl || isLocal);
    const [preParsed, setPreParsed] = useState<ParsedData | null>(null);
    const [fromUrl, setFromUrl] = useState<string | undefined>(undefined);

    const load = useCallback(async (url: string) => {
        setLoading(true);
        setErr(null);
        setPreParsed(null);
        try {
            const r = await fetch(url);
            if (!r.ok) {
                setErr(`Failed to load file (${r.status}). Check the link or re-upload.`);
                setText("");
                return;
            }
            const t = await r.text();
            setText(t);
            setFromUrl(url);
            if (r.headers.get("content-disposition")) {
                const m = r.headers.get("content-disposition")?.match(/filename="?([^";]+)/);
                if (m) setLabel(m[1] ?? "document");
            }
        } catch {
            setErr("Could not fetch the file. Try uploading again or use a local file from the home page.");
            setText("");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLocal) {
            setErr(null);
            setPreParsed(null);
            setFromUrl(undefined);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            void (async () => {
            const s = await takeRemapPayload(idbKey);
            if (!s) {
                setErr("No file in handoff. Choose a file on the home page, or use Replace file here.");
                setText("");
                setLoading(false);
                return;
            }
            setLabel(s.fileName);
            if (s.kind === "text") {
                setText(s.text);
                setPreParsed(null);
            } else {
                setText("");
                try {
                    const ab = base64ToArrayBuffer(s.base64);
                    setPreParsed(parseArrayBuffer(ab, s.fileName));
                } catch (e) {
                    setErr(e instanceof Error ? e.message : "Failed to read Excel from storage.");
                }
            }
            setLoading(false);
            })();
            return;
        }

        if (fileUrl) {
            setPreParsed(null);
            void load(fileUrl);
        } else {
            setText("");
            setPreParsed(null);
            setFromUrl(undefined);
            setLoading(false);
        }
    }, [fileUrl, isLocal, idbKey, load]);

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading file…
            </div>
        );
    }

    if (err) {
        return (
            <div className="space-y-4">
                <p className="text-destructive">{err}</p>
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href="/">Home</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/upload">Cloud upload</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (isLocal && !loading && !err && (text !== null || preParsed !== null)) {
        return <DataMapper initialText={text ?? ""} fileLabel={label} initialParsed={preParsed} />;
    }

    if (fileUrl && text !== null) {
        return <DataMapper initialText={text} fileLabel={label} fileUrl={fromUrl || fileUrl} initialParsed={null} />;
    }

    if (!fileUrl && !isLocal) {
        return (
            <div className="space-y-3">
                <p className="text-muted-foreground">No file in this session. Pick a file on the home page or use cloud upload.</p>
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href="/">Choose a file</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/upload">Cloud upload</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
