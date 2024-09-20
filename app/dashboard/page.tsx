"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const { userId } = useAuth();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
            <p>User ID: {userId}</p>
            <Link href="/upload">
                <Button>Upload New Document</Button>
            </Link>
        </div>
    );
}
