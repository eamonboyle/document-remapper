import { AppSubpage } from "@/components/AppSubpage";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <AppSubpage
            icon={Settings}
            eyebrow="Account"
            title="Settings"
            description="Workspace and account preferences will appear here. Nothing to configure yet."
        />
    );
}
