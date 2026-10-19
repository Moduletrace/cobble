import { describe, expect, test } from "bun:test";
import { z } from "zod";
import HarnessError from "../harness-error";
import type { HarnessCandidate, HarnessTool } from "../types";
import type { GenerateTextParams, GenerateTextResult } from "./generate-text";
import runTextLoop from "./run-text-loop";

const candidate: HarnessCandidate = {
    key: "1:m",
    provider: { id: 1, kind: "openrouter", base_url: "https://x.test" },
    model: {
        slug: "m",
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_tools: true,
    },
    source: "auto",
};

const memory: string[] = [];

const remember: HarnessTool<{ note: string }> = {
    name: "remember",
    description: "Keeps a note.",
    schema: z.object({ note: z.string() }),
    run: async ({ args }) => {
        memory.push(args.note);
        return "Saved.";
    },
};

/**
 * A fake model that plays back scripted turns and records what it saw.
 */
function scripted(turns: Partial<GenerateTextResult>[]) {
    const seen: GenerateTextParams[] = [];

    const generate = async (params: GenerateTextParams) => {
        seen.push(structuredClone({ ...params, signal: undefined }));
        const turn = turns[seen.length - 1] || { text: "Done." };

        return {
            text: null,
            tool_calls: [],
            candidate,
            ...turn,
        } as GenerateTextResult;
    };

    return { generate, seen };
}

const resolveCandidates = async () => [candidate];

describe("runTextLoop", () => {
    test("runs tools and feeds their results back until the model answers", async () => {
        memory.length = 0;
        const { generate, seen } = scripted([
            {
                text: "Noting that.",
                tool_calls: [
                    { id: "c1", name: "remember", arguments: `{"note":"tea"}` },
                ],
                usage: { prompt_tokens: 10, completion_tokens: 3, cost: 0.5 },
            },
            {
                text: "I'll remember you like tea.",
                usage: { prompt_tokens: 20, completion_tokens: 5 },
            },
        ]);
        const steps: number[] = [];

        const result = await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "I like tea." }],
            tools: [remember],
            generate,
            resolveCandidates,
            onStep: ({ index }) => {
                steps.push(index);
            },
        });

        expect(result.text).toBe("I'll remember you like tea.");
        expect(result.steps).toBe(2);
        expect(steps).toEqual([0, 1]);
        expect(memory).toEqual(["tea"]);
        expect(result.usage).toEqual({
            prompt_tokens: 30,
            completion_tokens: 8,
            cost: 0.5,
        });
        expect(seen[0]!.messages[0]).toEqual({
            role: "system",
            content: "You are a bot.",
        });
        expect(seen[0]!.tools?.[0]?.name).toBe("remember");
        expect(seen[1]!.prefer_key).toBe("1:m");
        expect(seen[1]!.messages.slice(-2)).toEqual([
            {
                role: "assistant",
                content: "Noting that.",
                tool_calls: [
                    { id: "c1", name: "remember", arguments: `{"note":"tea"}` },
                ],
            },
            { role: "tool", tool_call_id: "c1", content: "Saved." },
        ]);
    });

    test("asks the model to wrap up, without tools, after the last step", async () => {
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([
            loop_call,
            loop_call,
            { text: "Ran out of room; here's where I got to.", ...loop_call },
        ]);

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_steps: 2,
            generate,
            resolveCandidates,
        });

        expect(seen).toHaveLength(3);
        expect(seen[2]!.tools).toBe(undefined);
        expect(seen[2]!.messages.at(-1)).toMatchObject({ role: "user" });
        expect(result.text).toBe("Ran out of room; here's where I got to.");
        expect(result.messages.at(-1)).toEqual({
            role: "assistant",
            content: "Ran out of room; here's where I got to.",
        });
    });

    test("stops when cancelled", async () => {
        const controller = new AbortController();
        controller.abort();

        const error = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            signal: controller.signal,
            generate: scripted([]).generate,
            resolveCandidates,
        }).catch((e) => e);

        expect(error).toBeInstanceOf(HarnessError);
        expect(error.code).toBe("aborted");
    });
});
