"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const { isSignedIn, userId } = useAuth();

    if (!isSignedIn) {
        return (
            <div className="container max-w-lg py-12">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-2">Sign in to use cloud upload and see your account here.</p>
                <div className="mt-6">
                    <SignInButton mode="modal">
                        <Button>Sign in</Button>
                    </SignInButton>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl py-8">
            <h1 className="text-2xl font-bold">Your workspace</h1>
            <p className="text-muted-foreground mt-1 text-sm">Session id: {userId}</p>
            <p className="text-muted-foreground mt-4 text-sm">
                This app processes files in the browser. Cloud upload sends files to your configured storage so you can share links. Use
                the home page for fully local files.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                    <Link href="/">Map a file</Link>
                </Button>
                <Button variant="secondary" asChild>
                    <Link href="/upload">Upload to cloud</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/export">Export formats</Link>
                </Button>
            </div>
        </div>
    );
}
