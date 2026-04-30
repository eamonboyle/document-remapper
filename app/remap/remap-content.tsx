"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataMapper } from "@/components/DataMapper";
import { Loader2 } from "lucide-react";
import { getRemapSession } from "@/lib/remapSession";
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
            const s = getRemapSession();
            if (!s) {
                setErr("No file in session. Choose a file from the home page, or use Replace file below after opening this page with data.");
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
                    setErr(e instanceof Error ? e.message : "Failed to read Excel from session.");
                }
            }
            setLoading(false);
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
    }, [fileUrl, isLocal, load]);

    if (loading) {
        return (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card/40 px-6 py-16 text-muted-foreground backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
                <p className="text-sm font-medium">Loading file…</p>
            </div>
        );
    }

    if (err) {
        return (
            <div className="space-y-6 rounded-2xl border border-destructive/35 bg-destructive/5 px-6 py-8">
                <p className="text-sm leading-relaxed text-destructive">{err}</p>
                <div className="flex flex-wrap gap-3">
                    <Button className="rounded-xl" asChild>
                        <Link href="/">Home</Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl" asChild>
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
            <div className="space-y-6 rounded-2xl border border-border/60 bg-muted/20 px-6 py-10">
                <p className="text-sm leading-relaxed text-muted-foreground">
                    No file in this session. Pick a file on the home page or use cloud upload.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button className="rounded-xl" asChild>
                        <Link href="/">Choose a file</Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl" asChild>
                        <Link href="/upload">Cloud upload</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
