"use client";

import { useSearchParams } from 'next/navigation';
import { DataMapper } from "@/components/DataMapper";

export default function RemapPage() {
    const searchParams = useSearchParams();
    const fileUrl = searchParams.get('fileUrl');

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Remap Document</h1>
            {fileUrl ? (
                <DataMapper fileUrl={fileUrl} />
            ) : (
                <p>No file URL provided. Please upload a file first.</p>
            )}
        </div>
    );
}
