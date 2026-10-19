import type {
    HarnessOverview,
    HarnessSettingsFormObject,
} from "@/src/types";

type Params = {
    harnesses: HarnessOverview[];
};

/**
 * The saved harness settings as form values.
 */
export default function toHarnessForm({
    harnesses,
}: Params): HarnessSettingsFormObject {
    return Object.fromEntries(
        harnesses.map((harness) => [
            harness.harness,
            {
                inherit: harness.inherit,
                model_id: harness.model_id ?? null,
                provider_id: harness.provider_id ?? null,
                fallback: harness.fallback,
                enabled: harness.enabled,
                voice:
                    typeof harness.options.voice == "string"
                        ? harness.options.voice
                        : undefined,
            },
        ]),
    );
}
