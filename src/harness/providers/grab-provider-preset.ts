import {
    HarnessProviderKinds,
    type HarnessProviderKind,
    type HarnessProviderPreset,
} from "@/src/dict/harness-provider-dict";

type Params = {
    kind: HarnessProviderKind | string | null | undefined;
};

/**
 * The preset for a provider kind. Unknown kinds are treated as a generic
 * OpenAI-compatible server.
 */
export default function grabProviderPreset({
    kind,
}: Params): HarnessProviderPreset {
    return (
        HarnessProviderKinds.find((preset) => preset.value == kind) ||
        HarnessProviderKinds.find((preset) => preset.value == "custom")!
    );
}
