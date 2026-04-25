"use client";

import { useState } from "react";
import type { TransformPreset } from "@/lib/etl/transformPresets";
import { PRESET_CHOOSE } from "@/lib/etl/transformPresets";
import { cn } from "@/lib/utils";

type Props = {
    presets: TransformPreset[];
    onPick: (jexl: string) => void;
    className?: string;
    "aria-label"?: string;
    size?: "sm" | "xs";
};

/**
 * Stays on “Insert…” after each choice so the user can add another or leave as-is.
 */
export function TransformPresetSelect({ presets, onPick, className, "aria-label": ariaLabel, size = "xs" }: Props) {
    const [value, setValue] = useState(PRESET_CHOOSE);

    return (
        <select
            value={value}
            aria-label={ariaLabel}
            onChange={(e) => {
                const id = e.target.value;
                if (id === PRESET_CHOOSE) return;
                const p = presets.find((x) => x.id === id);
                if (p) onPick(p.jexl);
                setValue(PRESET_CHOOSE);
            }}
            className={cn(
                "shrink-0 max-w-full rounded border text-muted-foreground",
                size === "xs" ? "py-0.5 pl-1 pr-0.5 text-[10px] leading-tight" : "py-1 pl-1.5 pr-1 text-xs",
                className
            )}
            size={1}
        >
            <option value={PRESET_CHOOSE}>
                Insert…
            </option>
            {presets.map((p) => (
                <option key={p.id} value={p.id} title={p.jexl}>
                    {p.label}
                </option>
            ))}
        </select>
    );
}
