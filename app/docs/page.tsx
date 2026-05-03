import Link from "next/link";
import { AppSubpage } from "@/components/AppSubpage";
import { BookOpen } from "lucide-react";

export default function DocsPage() {
    return (
        <AppSubpage
            icon={BookOpen}
            eyebrow="Guides"
            title="Documentation"
            description="Detailed guides and reference material will live here. Until then, see export formats on the Formats page."
        >
            <p className="text-sm text-muted-foreground">
                <Link href="/export" className="font-medium text-brand hover:underline">
                    Export &amp; formats reference →
                </Link>
            </p>
        </AppSubpage>
    );
}
