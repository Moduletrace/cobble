import { describe, expect, test } from "bun:test";
import { TaskPlanPrompt } from "@/src/data/harness-prompts";
import type { HarnessCandidate, HarnessMessage } from "@/src/harness/types";
import type { GenerateTextParams } from "@/src/harness/text/generate-text";
import planBotTask from "./plan-bot-task";

const candidate = {
    key: "1:m",
    provider: { id: 1, kind: "openrouter", base_url: "https://x.test" },
    model: { slug: "m", input_modalities: ["text"], output_modalities: ["text"], supports_tools: true },
    source: "auto",
} as HarnessCandidate;

const plan = {
    goal: "Ship the release notes",
    gather: ["docs/changelog.md"],
    steps: ["Read the changelog", "Write the notes"],
    done: "The notes are on the site",
};

function fakeGenerate({ text }: { text: string }) {
    const seen: GenerateTextParams[] = [];

    const generate = (async (params: GenerateTextParams) => {
        seen.push(structuredClone({ ...params, signal: undefined }));

        return { text, tool_calls: [], candidate };
    }) as unknown as typeof import("@/src/harness/text/generate-text").default;

    return { generate, seen };
}

const messages: HarnessMessage[] = [{ role: "user", content: "Write the release notes." }];

describe("planBotTask", () => {
    test("asks for the plan in one turn on the prompt the run sends anyway", async () => {
        const { generate, seen } = fakeGenerate({ text: JSON.stringify(plan) });

        const planned = await planBotTask({
            system: "You are a bot.",
            messages,
            signal: new AbortController().signal,
            bot_id: 3,
            workspace_id: 7,
            generate,
        });

        expect(planned).toEqual({ plan, candidate });
        expect(seen.length).toBe(1);
        expect(seen[0]!.messages[0]).toEqual({ role: "system", content: "You are a bot." });
        expect(String(seen[0]!.messages[1]!.role)).toBe("user");
        expect(String(seen[0]!.messages[1]!.content)).toContain("Write the release notes.");
        expect(String(seen[0]!.messages[1]!.content)).toContain(TaskPlanPrompt);
        expect(seen[0]!.bot_id).toBe(3);
        expect(seen[0]!.workspace_id).toBe(7);
        expect(seen[0]!.tools).toBeUndefined();
    });

    test("leaves the run's own opening as it was", async () => {
        const { generate } = fakeGenerate({ text: JSON.stringify(plan) });

        await planBotTask({ system: "You are a bot.", messages, signal: new AbortController().signal, generate });

        expect(messages).toEqual([{ role: "user", content: "Write the release notes." }]);
    });

    test("is null when the answer isn't a plan, so the run starts unplanned", async () => {
        const { generate } = fakeGenerate({ text: "I'll figure it out as I go." });

        const planned = await planBotTask({
            system: "You are a bot.",
            messages,
            signal: new AbortController().signal,
            generate,
        });

        expect(planned).toBeNull();
    });
});