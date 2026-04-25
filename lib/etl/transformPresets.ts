/**
 * One-click Jexl snippets for the field transform column and the row filter.
 * Labels are short; `jexl` is the exact string inserted.
 */

export interface TransformPreset {
    id: string;
    label: string;
    jexl: string;
}

/** First option in selects — no-op */
export const PRESET_CHOOSE = "___choose";

export const TRANSFORM_PRESETS: TransformPreset[] = [
    { id: "to-number", label: "To number (strip $ , % )", jexl: "value|toNumber" },
    { id: "int", label: "To integer", jexl: "value|int" },
    { id: "trim", label: "Trim", jexl: "value|trim" },
    { id: "upper", label: "UPPER", jexl: "value|upper" },
    { id: "lower", label: "lower", jexl: "value|lower" },
    { id: "default-blank", label: "Default if blank → em dash", jexl: "value|default('—')" },
    { id: "default-zero", label: "Default if blank → 0", jexl: "value|default(0)" },
    { id: "strip-commas", label: "Remove commas, then number", jexl: "value|replace(\",\", \"\")|toNumber" },
    { id: "currency-clean", label: "Strip $ and commas → number", jexl: "value|replace(\"$\", \"\")|replace(\",\", \"\")|toNumber" },
    { id: "percent", label: "Percent string → 0–1", jexl: "value|replace(\"%\", \"\")|toNumber/100" },
    { id: "iso-date-tz", label: "ISO date: T → space, drop Z", jexl: "value|replace(\"T\", \" \")|replace(\"Z\", \"\")|trim" },
];

/**
 * Row filter: context is `c` / `row` (row object), `i` / `rowIndex`. Edit column names in brackets to match your headers.
 */
export const ROW_FILTER_PRESETS: TransformPreset[] = [
    { id: "col-not-empty", label: "Column not empty (edit \"Status\")", jexl: "!(isEmpty(c[\"Status\"]))" },
    { id: "amount-gt-0", label: "c['Amount'] as number > 0", jexl: "c['Amount']|toNumber>0" },
    { id: "status-active", label: "c['Status'] == 'active'", jexl: "c['Status'] == 'active'" },
    { id: "first-1000", label: "First 1000 rows (i<1000)", jexl: "i<1000" },
    { id: "skip-first-row", label: "Skip first row (i>0)", jexl: "i>0" },
    { id: "even-rows", label: "Even index rows (0,2,4,…)", jexl: "i%2==0" },
];
