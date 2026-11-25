import type { HarnessAdapter } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import providerRequest from "./provider-request";
import readChatResponse from "./read-chat-response";
import toWireChatParams from "./to-wire-chat-params";
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
            // Generation settings first, so the core fields below always win:
            // a saved parameter must never override the model, the messages,
            // the tools or the token ceiling (R12).
            ...toWireChatParams({ params, kind: provider.kind }),
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
