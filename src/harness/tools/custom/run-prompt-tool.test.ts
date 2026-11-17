import { afterAll, describe, expect, mock, test } from "bun:test";
import type { CustomToolPromptConfig } from "@/src/types";
import type { HarnessMessage } from "../../types";

let sent: HarnessMessage[] = [];
let answer = "the answer";

mock.module("../../text/generate-text", () => ({
    default: async ({ messages }: { messages: HarnessMessage[] }) => {
        sent = messages;
        return { text: answer };
    },
}));

const { default: runPromptTool } = await import("./run-prompt-tool");

afterAll(() => mock.restore());

const signal = new AbortController().signal;

function prompt(text: string): CustomToolPromptConfig {
    return { prompt: text } as CustomToolPromptConfig;
}

describe("runPromptTool secret handling (R1)", () => {
    test("a secret env fills in as its marker, never its value, in the model's input", async () => {
        sent = [];
        answer = "the answer";

        const result = await runPromptTool({
            config: prompt(`Use {{env.API_TOKEN}} at {{env.BASE}} about {{args.topic}}.`),
            args: { topic: "cats" },
            envs: [
                { key: "API_TOKEN", value: "sk-supersecret123", secret: true },
                { key: "BASE", value: "https://api.example.com", secret: false },
            ],
            signal,
        });

        const content = String(sent[0]?.content);

        expect(content).toContain("[API_TOKEN]");
        expect(content).not.toContain("sk-supersecret123");
        expect(content).toContain("https://api.example.com");
        expect(content).toContain("cats");
        expect(result).toBe("the answer");
    });

    test("a non-secret env still fills in with its value", async () => {
        sent = [];

        await runPromptTool({
            config: prompt(`Base: {{env.BASE}}`),
            args: {},
            envs: [{ key: "BASE", value: "https://api.example.com", secret: false }],
            signal,
        });

        expect(String(sent[0]?.content)).toBe("Base: https://api.example.com");
    });

    test("an empty answer reads as no answer", async () => {
        answer = "";

        const result = await runPromptTool({
            config: prompt("Hi"),
            args: {},
            envs: [],
            signal,
        });

        expect(result).toBe("(no answer)");
    });
});