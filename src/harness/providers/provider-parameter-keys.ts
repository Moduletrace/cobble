import type { HarnessParameterKey } from "@/src/dict/harness-parameter-dict";
import {
    HarnessProviderKinds,
    type HarnessProviderKind,
} from "@/src/dict/harness-provider-dict";
import { isDashScopeHost } from "./openai-compatible/dashscope-hosts";

/**
 * What Alibaba's compatible mode documents taking, the Token Plan hosts
 * included. `thinking_budget` is refused by a few of their models, so it is
 * offered but not sent until asked for.
 */
const DashScopeParameters: readonly HarnessParameterKey[] = [
    "temperature",
    "top_p",
    "presence_penalty",
    "seed",
    "enable_thinking",
    "thinking_budget",
];

type Params = {
    kind: HarnessProviderKind;
    base_url?: string | null;
    /**
     * What the provider's own row saved, when a super admin set it. An empty
     * array is a real answer (it takes none); null or undefined follows the
     * preset, then the host.
     */
    declared?: readonly HarnessParameterKey[] | null;
};

/**
 * The generation settings a provider's models are offered: what its row
 * saved, else its preset's list, else the list for its host (a custom
 * provider pointed at Alibaba). Undefined when nobody knows, which leaves its
 * models with no settings rather than sending a field it might refuse.
 */
export default function providerParameterKeys({
    kind,
    base_url,
    declared,
}: Params): HarnessParameterKey[] | undefined {
    if (declared) return [...declared];

    const preset = HarnessProviderKinds.find((p) => p.value == kind);

    if (preset?.parameters.length) return [...preset.parameters];

    /**
     * OpenRouter's catalog says what each model takes, so its models keep
     * their own list.
     */
    if (kind != "openrouter" && isDashScopeHost({ base_url })) {
        return [...DashScopeParameters];
    }

    return undefined;
}