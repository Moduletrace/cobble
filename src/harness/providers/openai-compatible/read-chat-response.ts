import HarnessError from "../../harness-error";
import type { HarnessChatResult, HarnessToolCall } from "../../types";

type WireToolCall = {
    id?: string;
    function?: { name?: string; arguments?: string | object };
};

type Params = {
    /**
     * The parsed chat completions response.
     */
    json: any;
    provider_name: string;
    candidate_key?: string;
};

/**
 * Reads a chat completions response. Providers sometimes answer 200 with an
 * `error` or with no choices; both throw a retryable `HarnessError`.
 */
export default function readChatResponse({
    json,
    provider_name,
    candidate_key,
}: Params): HarnessChatResult {
    if (json?.error) {
        const status = Number(json.error.code) || undefined;

        throw new HarnessError({
            message: `${provider_name}: ${json.error.message || "The model failed."}`,
            status,
            retryable: !status || status == 429 || status >= 500,
            candidate_key,
        });
    }

    const choice = json?.choices?.[0];

    if (!choice?.message) {
        throw new HarnessError({
            message: `${provider_name}: The model returned no answer.`,
            retryable: true,
            candidate_key,
        });
    }

    const content = choice.message.content;
    const text =
        typeof content == "string"
            ? content
            : Array.isArray(content)
              ? content
                    .map((part: any) =>
                        typeof part?.text == "string" ? part.text : "",
                    )
                    .join("")
              : null;

    const tool_calls: HarnessToolCall[] = (
        (choice.message.tool_calls || []) as WireToolCall[]
    )
        .filter((call) => call.function?.name)
        .map((call, index) => ({
            id: call.id || `call_${index}`,
            name: call.function!.name!,
            arguments:
                typeof call.function!.arguments == "string"
                    ? call.function!.arguments
                    : JSON.stringify(call.function!.arguments || {}),
        }));

    return {
        text: text || null,
        tool_calls,
        finish_reason: choice.finish_reason || undefined,
        usage: json.usage
            ? {
                  prompt_tokens: json.usage.prompt_tokens,
                  completion_tokens: json.usage.completion_tokens,
                  cost: json.usage.cost,
              }
            : undefined,
    };
}
