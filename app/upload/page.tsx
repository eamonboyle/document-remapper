"use client";

import Link from "next/link";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";

export default function UploadPage() {
    return (
        <div className="container max-w-lg px-4 py-12 sm:py-16">
            <div className="mb-8 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/25">
                    <Cloud className="h-6 w-6" aria-hidden />
                </span>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Hosting</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Cloud upload</h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Files are stored by your upload provider and opened in the mapper. Supported: CSV, TSV, JSON, JSON Lines, XML,
                        Excel. Max 8MB.
                    </p>
                </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/50 p-6 shadow-lg shadow-black/20 ring-1 ring-white/[0.04] backdrop-blur-md">
                <FileUpload />
            </div>
            <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
                Prefer to keep data in the browser?{" "}
                <Link href="/" className="font-medium text-brand underline-offset-4 hover:underline">
                    Choose a file
                </Link>{" "}
                on the home page.
            </p>
            <div className="mt-6 flex justify-center">
                <Button variant="ghost" className="rounded-xl text-muted-foreground" asChild>
                    <Link href="/">Back to home</Link>
                </Button>
            </div>
        </div>
    );
}
