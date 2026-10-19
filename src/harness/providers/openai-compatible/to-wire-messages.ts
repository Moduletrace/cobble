import type { HarnessContentPart, HarnessMessage } from "../../types";

type Params = {
    messages: HarnessMessage[];
};

/**
 * Harness messages in the OpenAI chat completions format.
 */
export default function toWireMessages({ messages }: Params) {
    return messages.map((message) => {
        switch (message.role) {
            case "system":
                return { role: "system", content: message.content };

            case "user":
                return {
                    role: "user",
                    content:
                        typeof message.content == "string"
                            ? message.content
                            : message.content.map((part) =>
                                  toWirePart({ part }),
                              ),
                };

            case "assistant":
                return {
                    role: "assistant",
                    content: message.content,
                    ...(message.tool_calls?.length
                        ? {
                              tool_calls: message.tool_calls.map((call) => ({
                                  id: call.id,
                                  type: "function",
                                  function: {
                                      name: call.name,
                                      arguments: call.arguments,
                                  },
                              })),
                          }
                        : {}),
                };

            case "tool":
                return {
                    role: "tool",
                    tool_call_id: message.tool_call_id,
                    content: message.content,
                };
        }
    });
}

function toWirePart({ part }: { part: HarnessContentPart }) {
    switch (part.type) {
        case "text":
            return { type: "text", text: part.text };

        case "image":
            return { type: "image_url", image_url: { url: part.url } };

        case "audio":
            return {
                type: "input_audio",
                input_audio: { data: part.data, format: part.format },
            };
    }
}
