import { AppSubpage } from "@/components/AppSubpage";
import { CircleDollarSign } from "lucide-react";

export default function PricingPage() {
    return (
        <AppSubpage
            icon={CircleDollarSign}
            eyebrow="Plans"
            title="Pricing"
            description="We&apos;re still finalizing plans. Check back soon — or get started free on the home page with local files and core mapping."
        />
    );
}
