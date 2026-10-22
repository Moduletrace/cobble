import type { HarnessKind } from "@/src/dict/harness-dict";
import type {
    HarnessFormValue,
    HarnessSettingsFormObject,
} from "@/src/types";

type Params = {
    form: HarnessSettingsFormObject;
    saved: HarnessSettingsFormObject;
};

/**
 * The harness settings that differ from what is saved, ready to send.
 */
export default function changedHarnessSettings({ form, saved }: Params) {
    return (Object.keys(form) as HarnessKind[]).flatMap((harness) => {
        const value = form[harness];

        if (!value || isSame({ a: value, b: saved[harness] })) return [];

        return [{ harness, ...value }];
    });
}

function isSame({ a, b }: { a: HarnessFormValue; b?: HarnessFormValue }) {
    return (
        Boolean(b) &&
        Boolean(a.inherit) == Boolean(b!.inherit) &&
        a.model_id == b!.model_id &&
        (a.provider_id ?? null) == (b!.provider_id ?? null) &&
        a.fallback == b!.fallback &&
        a.enabled == b!.enabled &&
        (a.voice || "") == (b!.voice || "") &&
        paramsKey({ params: a.params }) == paramsKey({ params: b!.params })
    );
}

/**
 * The generation settings as one comparable string.
 */
export function paramsKey({
    params,
}: {
    params?: Record<string, number | string>;
}) {
    const entries = Object.entries(params || {}).sort(([a], [b]) =>
        a.localeCompare(b),
    );

    return JSON.stringify(entries);
}
