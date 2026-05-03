import { AppSubpage } from "@/components/AppSubpage";
import { LayoutTemplate } from "lucide-react";

export default function PresetsPage() {
    return (
        <AppSubpage
            icon={LayoutTemplate}
            eyebrow="Saved work"
            title="Presets"
            description="Save and reuse mappings across files. Preset management is coming soon — build a mapping in the editor and export from there for now."
        />
    );
}
