import type { HarnessAdapter } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import providerRequest from "./provider-request";
import readChatResponse from "./read-chat-response";
import toWireMessages from "./to-wire-messages";

/**
 * `POST /chat/completions`, with tools when given.
 */
const chat: HarnessAdapter["chat"] = async ({
    candidate,
    messages,
    tools,
    max_tokens,
    params,
    signal,
}) => {
    const { provider, model } = candidate;

    const res = await providerRequest({
        provider,
        path: "/chat/completions",
        json: {
            model: model.slug,
            messages: toWireMessages({ messages }),
            ...(tools?.length
                ? {
                      tools: tools.map((tool) => ({
                          type: "function",
                          function: tool,
                      })),
                  }
                : {}),
            ...(max_tokens ? { max_tokens } : {}),
            ...(params || {}),
        },
        signal,
        candidate_key: candidate.key,
    });

    return readChatResponse({
        json: await res.json().catch(() => null),
        provider_name:
            provider.name || grabProviderPreset({ kind: provider.kind }).title,
        candidate_key: candidate.key,
    });
};

export default chat;
