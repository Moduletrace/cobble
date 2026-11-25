import type { HarnessProviderKind } from "@/src/dict/harness-provider-dict";
import type { HarnessWireParams } from "@/src/dict/harness-parameter-dict";

type Params = {
    params?: HarnessWireParams;
    kind: HarnessProviderKind;
};

/**
 * The generation settings as a provider's `/chat/completions` takes them.
 * OpenRouter nests the reasoning effort as `reasoning: { effort }`; everyone
 * else (OpenAI, Groq, Alibaba, a custom host) takes it flat as
 * `reasoning_effort`, where the nested form is ignored.
 */
export default function toWireChatParams({ params, kind }: Params) {
    const wire: HarnessWireParams = { ...(params || {}) };

    if (kind == "openrouter") return wire;

    const reasoning = wire.reasoning;

    if (reasoning && typeof reasoning == "object") {
        delete wire.reasoning;
        wire.reasoning_effort = reasoning.effort;
    }

    return wire;
}