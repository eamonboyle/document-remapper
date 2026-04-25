"use client";

import Link from "next/link";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
    return (
        <div className="container max-w-lg px-4 py-10">
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Cloud upload</h1>
            <p className="text-muted-foreground mb-6 text-sm">
                Files are stored by the upload provider and opened in the mapper. Supported: CSV, TSV, JSON, JSON Lines, XML, Excel. Max
                8MB.
            </p>
            <div className="border-border bg-card rounded-xl border p-6">
                <FileUpload />
            </div>
            <p className="text-muted-foreground mt-6 text-center text-sm">
                Prefer to keep data in the browser? Use{" "}
                <Link href="/" className="text-foreground font-medium underline underline-offset-2">
                    Choose a file
                </Link>{" "}
                on the home page.
            </p>
            <div className="mt-4 flex justify-center">
                <Button variant="ghost" asChild>
                    <Link href="/">Back to home</Link>
                </Button>
            </div>
        </div>
    );
}
