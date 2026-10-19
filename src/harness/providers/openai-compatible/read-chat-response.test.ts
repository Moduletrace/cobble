import { describe, expect, test } from "bun:test";
import HarnessError from "../../harness-error";
import readChatResponse from "./read-chat-response";

const read = (json: unknown) =>
    readChatResponse({ json, provider_name: "OpenRouter" });

describe("readChatResponse", () => {
    test("reads text, tool calls and usage", () => {
        expect(
            read({
                choices: [
                    {
                        finish_reason: "tool_calls",
                        message: {
                            content: "Checking.",
                            tool_calls: [
                                {
                                    id: "a1",
                                    type: "function",
                                    function: {
                                        name: "update_memory",
                                        arguments: `{"memory":"x"}`,
                                    },
                                },
                                {
                                    function: {
                                        name: "noop",
                                        arguments: { a: 1 },
                                    },
                                },
                                { function: {} },
                            ],
                        },
                    },
                ],
                usage: { prompt_tokens: 10, completion_tokens: 2, cost: 0 },
            }),
        ).toEqual({
            text: "Checking.",
            tool_calls: [
                {
                    id: "a1",
                    name: "update_memory",
                    arguments: `{"memory":"x"}`,
                },
                { id: "call_1", name: "noop", arguments: `{"a":1}` },
            ],
            finish_reason: "tool_calls",
            usage: { prompt_tokens: 10, completion_tokens: 2, cost: 0 },
        });
    });

    test("joins content parts and treats empty text as none", () => {
        expect(
            read({
                choices: [
                    {
                        message: {
                            content: [
                                { type: "text", text: "a" },
                                { type: "text", text: "b" },
                            ],
                        },
                    },
                ],
            }).text,
        ).toBe("ab");
        expect(read({ choices: [{ message: { content: "" } }] }).text).toBe(
            null,
        );
    });

    test("throws on an error body or no choices", () => {
        expect(() =>
            read({ error: { message: "Upstream down", code: 502 } }),
        ).toThrow(HarnessError);
        expect(() => read({ choices: [] })).toThrow("returned no answer");

        try {
            read({ error: { message: "bad", code: 400 } });
        } catch (error: any) {
            expect(error.retryable).toBe(false);
        }
    });
});
