"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
    const { isSignedIn } = useAuth();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">Document Remapper</h1>
            <p className="mb-4">Streamline your document restructuring process.</p>
            {isSignedIn ? (
                <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                </Link>
            ) : (
                <Link href="/sign-up">
                    <Button>Get Started</Button>
                </Link>
            )}
        </div>
    );
}
