import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { UnlimitedLimit } from "@/src/utils/run-limit";
import { alreadyRanToolNote, DroppedToolImageNote, SupersededSnapshotNote, ToolImagesNote } from "@/src/data/harness-prompts";
import HarnessError from "../harness-error";
import type { HarnessCandidate, HarnessTool } from "../types";
import type { HarnessTrace } from "../trace/types";
import type { GenerateTextParams, GenerateTextResult } from "./generate-text";
import runTextLoop, {
    IncomingMessagesNote,
    RedraftNote,
    stepsLowNote,
    stepsLowWarningLeft,
} from "./run-text-loop";

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
    test("shows tool images after the results and keeps only the newest", async () => {
        let shots = 0;
        const screenshot: HarnessTool = {
            name: "screenshot",
            description: "Takes a screenshot.",
            schema: z.object({}),
            run: async () => {
                shots++;
                return {
                    text: "[Image 1: shown after the tool results]",
                    images: [{ url: `data:image/png;base64,${shots}`, focus: "the screen" }],
                };
            },
        };
        const rounds = AppData.HarnessToolImagesKept + 1;
        const { generate, seen } = scripted(
            Array.from({ length: rounds }, (_, index) => ({
                text: null,
                tool_calls: [{ id: `c${index}`, name: "screenshot", arguments: "{}" }],
            })),
        );

        await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Check the site." }],
            tools: [screenshot],
            generate,
            resolveCandidates,
        });

        const first = seen[1]!.messages;
        expect(first.slice(-2)).toEqual([
            { role: "tool", tool_call_id: "c0", content: "[Image 1: shown after the tool results]" },
            {
                role: "user",
                content: [
                    { type: "text", text: ToolImagesNote },
                    { type: "text", text: "From screenshot:" },
                    { type: "image", url: "data:image/png;base64,1", focus: "the screen", from_tool: true },
                ],
            },
        ]);

        const last = seen[rounds]!.messages;
        const parts = last.flatMap((message) =>
            message.role == "user" && typeof message.content != "string" ? message.content : [],
        );
        const images = parts.filter((part) => part.type == "image");

        expect(images.map((part) => part.type == "image" && part.url)).toEqual(
            Array.from({ length: AppData.HarnessToolImagesKept }, (_, index) => `data:image/png;base64,${index + 2}`),
        );
        expect(parts).toContainEqual({ type: "text", text: DroppedToolImageNote });
    });

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
        expect(seen[2]!.messages.at(-1)!.content).toContain(
            "The tools you actually called this run: remember x2.",
        );
        expect(result.tool_uses).toEqual([
            { name: "remember", ok: true },
            { name: "remember", ok: true },
        ]);
        expect(result.text).toBe("Ran out of room; here's where I got to.");
        expect(result.messages.at(-1)).toEqual({
            role: "assistant",
            content: "Ran out of room; here's where I got to.",
        });
    });

    test("a run with no step limit keeps going, and records that its limits were off", async () => {
        memory.length = 0;
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const turns = 30;
        const { generate, seen } = scripted(Array.from({ length: turns }, () => loop_call));

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_steps: UnlimitedLimit,
            generate,
            resolveCandidates,
        });

        expect(seen).toHaveLength(turns + 1);
        expect(result.steps).toBe(turns + 1);
        expect(result.text).toBe("Done.");
        expect(JSON.stringify(seen)).not.toContain("left in this run");
        expect(seen[0]!.limits).toEqual({
            steps: UnlimitedLimit,
            run_tokens: UnlimitedLimit,
            context_tokens: UnlimitedLimit,
        });
    });

    test("at the wrap up, offers only the tools that save, then answers without any", async () => {
        const save: HarnessTool<{ path: string }> = {
            name: "write_file",
            description: "Saves a file.",
            schema: z.object({ path: z.string() }),
            run: async ({ args }) => `Saved ${args.path}.`,
        };
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([
            loop_call,
            {
                text: "Writing the report.",
                tool_calls: [{ id: "w", name: "write_file", arguments: `{"path":"report.md"}` }],
                usage: { prompt_tokens: 10, completion_tokens: 1 },
            },
            { text: "Report saved; here's what I found." },
        ]);

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "audit the disk" }],
            tools: [remember, save],
            max_steps: 1,
            generate,
            resolveCandidates,
        });

        expect(seen).toHaveLength(3);
        expect(seen[1]!.tools!.map((tool) => tool.name)).toEqual(["write_file"]);
        expect(seen[1]!.messages.at(-1)!.content).toContain("one turn to save what the user needs: write_file");
        expect(seen[2]!.tools).toBe(undefined);
        expect(result.tool_uses).toEqual([
            { name: "remember", ok: true },
            { name: "write_file", ok: true },
        ]);
        expect(result.text).toBe("Report saved; here's what I found.");
    });

    test("tells a saving turn that reaches for another tool what it may still call", async () => {
        const save: HarnessTool<{ path: string }> = {
            name: "write_file",
            description: "Saves a file.",
            schema: z.object({ path: z.string() }),
            run: async ({ args }) => `Saved ${args.path}.`,
        };
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([
            loop_call,
            { tool_calls: [{ id: "r", name: "remember", arguments: `{"note":"more"}` }] },
            {
                tool_calls: [{ id: "w", name: "write_file", arguments: `{"path":"report.md"}` }],
            },
            { text: "Report saved." },
        ]);

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "audit the disk" }],
            tools: [remember, save],
            max_steps: 1,
            generate,
            resolveCandidates,
        });

        expect(seen[2]!.messages.at(-1)!.content).toContain(
            "Only write_file can still be called in this run.",
        );
        expect(seen[3]!.tools).toBe(undefined);
        expect(result.tool_uses).toEqual([
            { name: "remember", ok: true },
            { name: "write_file", ok: true },
        ]);
        expect(result.text).toBe("Report saved.");
    });

    test("hands the work it can't finish to start_task at the wrap up", async () => {
        const hand_off: HarnessTool<{ brief: string }> = {
            name: "start_task",
            description: "Queues a run.",
            schema: z.object({ brief: z.string() }),
            run: async ({ args }) => `Run #7 queued: ${args.brief}`,
        };
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([
            loop_call,
            {
                tool_calls: [{ id: "t", name: "start_task", arguments: `{"brief":"write the piece"}` }],
            },
            { text: "Research done; the writing is queued as a run." },
        ]);

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "write the guide" }],
            tools: [remember, hand_off],
            max_steps: 1,
            generate,
            resolveCandidates,
        });

        expect(seen).toHaveLength(3);
        expect(seen[1]!.tools!.map((tool) => tool.name)).toEqual(["start_task"]);
        expect(seen[1]!.messages.at(-1)!.content).toContain(
            "one turn to hand the work on: start_task is still yours",
        );
        expect(seen[2]!.tools).toBe(undefined);
        expect(result.tool_uses).toEqual([
            { name: "remember", ok: true },
            { name: "start_task", ok: true },
        ]);
        expect(result.text).toBe("Research done; the writing is queued as a run.");
    });

    test("offers the saving tools and the hand off together", async () => {
        const save: HarnessTool<{ path: string }> = {
            name: "write_file",
            description: "Saves a file.",
            schema: z.object({ path: z.string() }),
            run: async ({ args }) => `Saved ${args.path}.`,
        };
        const hand_off: HarnessTool<{ brief: string }> = {
            name: "start_task",
            description: "Queues a run.",
            schema: z.object({ brief: z.string() }),
            run: async ({ args }) => `Run #7 queued: ${args.brief}`,
        };
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([
            loop_call,
            { text: "Saved what I have." },
        ]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "audit the disk" }],
            tools: [remember, save, hand_off],
            max_steps: 1,
            generate,
            resolveCandidates,
        });

        expect(seen[1]!.tools!.map((tool) => tool.name)).toEqual(["write_file", "start_task"]);
        const prompt = String(seen[1]!.messages.at(-1)!.content);

        expect(prompt).toContain("one turn to save what the user needs: write_file");
        expect(prompt).toContain("call start_task with a complete brief of what's left");
    });

    test("warns once, a few steps before the wrap up, in a long enough run", async () => {
        const max_steps = AppData.HarnessStepsLowMinSteps;
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted(Array.from({ length: max_steps + 1 }, () => loop_call));

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_steps,
            generate,
            resolveCandidates,
        });

        const left = stepsLowWarningLeft({ max_steps });
        const warned_at = max_steps - left;
        const note = stepsLowNote({ left });
        const warnings = seen.map((call) => call.messages.filter((m) => m.role == "user" && String(m.content).includes(note)).length);

        expect(warnings[warned_at - 1]).toBe(0);
        expect(warnings[warned_at]).toBe(1);
        expect(seen[warned_at]!.messages.at(-1)).toEqual({ role: "user", content: note });
        expect(warnings.at(-1)).toBe(1);
    });

    test("warns a long run early enough to write its report", () => {
        /**
         * A 200 step audit once measured to its last step with the report
         * unwritten: the warning has to reach it with real room left.
         */
        expect(stepsLowWarningLeft({ max_steps: 200 })).toBe(
            Math.ceil(200 * AppData.HarnessStepsLowWarnShare),
        );
        expect(stepsLowWarningLeft({ max_steps: 20 })).toBe(AppData.HarnessStepsLowWarning);
    });

    test("doesn't warn a short run", async () => {
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([loop_call, loop_call, { text: "Done." }]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_steps: 2,
            generate,
            resolveCandidates,
        });

        expect(JSON.stringify(seen)).not.toContain("left in this run");
    });

    test("records failed tool calls, and tells the wrap up so", async () => {
        const { generate, seen } = scripted([
            { tool_calls: [{ id: "c", name: "missing_tool", arguments: "{}" }] },
            { text: "Couldn't do it." },
        ]);

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_steps: 1,
            generate,
            resolveCandidates,
        });

        expect(result.tool_uses).toEqual([{ name: "missing_tool", ok: false }]);
        expect(seen[1]!.messages.at(-1)!.content).toContain(
            "The tools you actually called this run: missing_tool (failed).",
        );
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

    test("takes in what the user wrote while tools ran, before the next turn", async () => {
        memory.length = 0;
        const { generate, seen } = scripted([
            { tool_calls: [{ id: "c1", name: "remember", arguments: `{"note":"tea"}` }] },
            { text: "Coffee it is." },
        ]);
        const arrivals = [[{ role: "user" as const, content: "Actually, coffee." }]];

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "I like tea." }],
            tools: [remember],
            generate,
            resolveCandidates,
            incoming: async () => arrivals.shift() || [],
        });

        expect(result.text).toBe("Coffee it is.");
        expect(seen).toHaveLength(2);
        expect(seen[1]!.messages.slice(-2)).toEqual([
            { role: "tool", tool_call_id: "c1", content: "Saved." },
            { role: "user", content: `${IncomingMessagesNote}\n\nActually, coffee.` },
        ]);
    });

    test("writes an answer again when the user wrote past it, keeping the draft and tool turns", async () => {
        const { generate, seen } = scripted([
            { text: "Here's the summary in English." },
            { text: "Here's the summary in French." },
        ]);
        const arrivals = [
            [
                { role: "user" as const, content: "In French, please." },
                { role: "user" as const, content: "And short." },
            ],
        ];

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "Summarise it." }],
            generate,
            resolveCandidates,
            incoming: async () => arrivals.shift() || [],
        });

        expect(result.text).toBe("Here's the summary in French.");
        expect(result.steps).toBe(2);
        expect(seen[1]!.messages.slice(-2)).toEqual([
            { role: "assistant", content: "Here's the summary in English." },
            {
                role: "user",
                content: `${RedraftNote}\n\nIn French, please.\n\nAnd short.`,
            },
        ]);
    });

    test("joins files from new messages onto the same user turn", async () => {
        const { generate, seen } = scripted([{ text: "Draft." }, { text: "With the photo." }]);
        const arrivals = [
            [
                {
                    role: "user" as const,
                    content: [
                        { type: "text" as const, text: "Use this one." },
                        { type: "image" as const, url: "data:image/png;base64,x" },
                    ],
                },
            ],
        ];

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "Write the caption." }],
            generate,
            resolveCandidates,
            incoming: async () => arrivals.shift() || [],
        });

        expect(seen[1]!.messages.at(-1)).toEqual({
            role: "user",
            content: [
                { type: "text", text: RedraftNote },
                { type: "text", text: "Use this one." },
                { type: "image", url: "data:image/png;base64,x" },
            ],
        });
    });

    test("returns at once when nothing new came in", async () => {
        const { generate, seen } = scripted([{ text: "Hi." }]);
        let looks = 0;

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "Hello" }],
            generate,
            resolveCandidates,
            incoming: async () => {
                looks++;
                return [];
            },
        });

        expect(result.text).toBe("Hi.");
        expect(seen).toHaveLength(1);
        expect(looks).toBe(1);
    });

    test("doesn't redraft the wrap up: a later reply picks the new messages up", async () => {
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([loop_call, { text: "Out of steps." }]);
        let looks = 0;

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_steps: 1,
            generate,
            resolveCandidates,
            incoming: async () => {
                looks++;
                return looks == 1 ? [{ role: "user", content: "Also this." }] : [];
            },
        });

        expect(result.text).toBe("Out of steps.");
        expect(seen).toHaveLength(2);
        expect(looks).toBe(1);
        expect(typeof seen[1]!.messages.at(-1)!.content).toBe("string");
        expect(seen[1]!.messages.at(-1)!.content).toContain("Also this.");
        expect(seen[1]!.messages.at(-1)!.content).toContain("You've used every step");
    });

    test("tells the run its own notes with what came in", async () => {
        const { generate, seen } = scripted([
            { tool_calls: [{ id: "c1", name: "remember", arguments: `{"note":"x"}` }] },
            { text: "Report." },
            { text: "Report, corrected." },
        ]);
        const arrivals = [
            [{ role: "user" as const, content: "Use photos too." }],
            [{ role: "user" as const, content: "And keep it short." }],
        ];

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "Brief." }],
            tools: [remember],
            generate,
            resolveCandidates,
            incoming: async () => arrivals.shift() || [],
            incoming_notes: { working: "Working note.", redraft: "Redraft note." },
        });

        expect(result.text).toBe("Report, corrected.");
        expect(seen[1]!.messages.at(-1)).toEqual({ role: "user", content: "Working note.\n\nUse photos too." });
        expect(seen[2]!.messages.at(-1)).toEqual({ role: "user", content: "Redraft note.\n\nAnd keep it short." });
    });

    test("with a wrap up note, takes in what came in by the wrap up before it", async () => {
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
        };
        const { generate, seen } = scripted([loop_call, { text: "Out of steps." }]);
        let looks = 0;

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_steps: 1,
            generate,
            resolveCandidates,
            incoming: async () => {
                looks++;
                return looks == 2 ? [{ role: "user", content: "Late correction." }] : [];
            },
            incoming_notes: { wrap_up: "Too late to act." },
        });

        expect(looks).toBe(2);
        const last = seen[1]!.messages.at(-1)!.content as string;
        expect(last).toContain("Too late to act.\n\nLate correction.");
        expect(last.indexOf("Late correction.")).toBeLessThan(last.indexOf("You've used every step"));
    });

    test("writes an answer the review faults again, once, with its note and the tool calls", async () => {
        const { generate, seen } = scripted([
            { text: null, tool_calls: [{ id: "c1", name: "remember", arguments: '{"note":"x"}' }] },
            { text: "I'm scanning now. Scan done: 5 contests." },
            { text: "I haven't scanned yet." },
            { text: "never reached" },
        ]);
        const reviewed: { text: string; tools: string[] }[] = [];

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "Scan." }],
            tools: [remember],
            generate,
            resolveCandidates,
            review: async ({ text, tool_uses }) => {
                reviewed.push({ text, tools: tool_uses.map((use) => use.name) });
                return "Not sent: nothing scanned.";
            },
        });

        expect(result.text).toBe("I haven't scanned yet.");
        expect(reviewed).toEqual([{ text: "I'm scanning now. Scan done: 5 contests.", tools: ["remember"] }]);
        expect(seen[2]!.messages.slice(-2)).toEqual([
            { role: "assistant", content: "I'm scanning now. Scan done: 5 contests." },
            { role: "user", content: "Not sent: nothing scanned." },
        ]);
    });

    test("lets the answer through when the review passes it or throws", async () => {
        for (const review of [async () => null, async () => Promise.reject(new Error("db down"))]) {
            const { generate, seen } = scripted([{ text: "Fine." }]);

            const result = await runTextLoop({
                system: "s",
                messages: [{ role: "user", content: "Hi." }],
                generate,
                resolveCandidates,
                review,
            });

            expect(result.text).toBe("Fine.");
            expect(seen.length).toBe(1);
        }
    });

    test("doesn't review the wrap up", async () => {
        const { generate } = scripted([
            { text: null, tool_calls: [{ id: "c1", name: "remember", arguments: '{"note":"x"}' }] },
            { text: "Out of steps." },
        ]);
        let reviews = 0;

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "Go." }],
            tools: [remember],
            max_steps: 1,
            generate,
            resolveCandidates,
            review: async () => {
                reviews++;
                return "Not sent.";
            },
        });

        expect(result.text).toBe("Out of steps.");
        expect(reviews).toBe(0);
    });

    test("wraps up once the run has spent its token budget", async () => {
        const loop_call = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
            usage: { prompt_tokens: 600, completion_tokens: 1 },
        };
        const { generate, seen } = scripted([loop_call, loop_call, { text: "Stopping here.", ...loop_call }]);

        const result = await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_prompt_tokens: 1000,
            generate,
            resolveCandidates,
        });

        expect(seen).toHaveLength(3);
        expect(seen[2]!.tools).toBe(undefined);
        expect(seen[2]!.messages.at(-1)!.content).toContain("This run has used all the tokens it may spend.");
        expect(result.text).toBe("Stopping here.");
    });

    test("keeps only the newest page snapshot in the transcript", async () => {
        let page = 0;
        const snapshot: HarnessTool = {
            name: "browser_snapshot",
            description: "Reads the page.",
            schema: z.object({}),
            run: async () => `page ${++page}`,
        };
        const snap = (id: string) => ({ tool_calls: [{ id, name: "browser_snapshot", arguments: "{}" }] });
        const { generate, seen } = scripted([snap("a"), snap("b")]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "Look." }],
            tools: [snapshot],
            generate,
            resolveCandidates,
        });

        const tool_turns = seen[2]!.messages.filter((message) => message.role == "tool");

        expect(tool_turns.map((message) => message.content)).toEqual([SupersededSnapshotNote, "page 2"]);
    });

    test("lists deferred tools by name and gives their definitions once loaded", async () => {
        const big = "Does a thing. ".repeat(Math.ceil(AppData.HarnessDeferToolsMinChars / 14));
        const used: string[] = [];
        const extension = (name: string): HarnessTool => ({
            name,
            description: big,
            parameters: { type: "object", properties: {} },
            deferred: true,
            run: async () => {
                used.push(name);
                return "done";
            },
        });
        const { generate, seen } = scripted([
            { tool_calls: [{ id: "1", name: "load_tools", arguments: `{"names":["srv__a"]}` }] },
            { tool_calls: [{ id: "2", name: "srv__a", arguments: "{}" }] },
            { tool_calls: [{ id: "3", name: "srv__b", arguments: "{}" }] },
            { text: "Done." },
        ]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember, extension("srv__a"), extension("srv__b")],
            generate,
            resolveCandidates,
        });

        const names = (index: number) => seen[index]!.tools!.map((tool) => tool.name);

        expect(names(0)).toEqual(["remember", "load_tools"]);
        expect(String(seen[0]!.messages[0]!.content)).toContain("Tools you can load");
        expect(String(seen[0]!.messages[0]!.content)).toContain("- srv__a: Does a thing.");
        expect(names(1)).toEqual(["remember", "load_tools", "srv__a"]);
        expect(seen[1]!.messages.at(-1)!.content).toContain("Loaded: srv__a.");
        expect(names(3)).toEqual(["remember", "load_tools", "srv__a", "srv__b"]);
        expect(used).toEqual(["srv__a", "srv__b"]);
    });

    test("gives small deferred tools straight away", async () => {
        const small: HarnessTool = { ...remember, name: "srv__small", deferred: true };
        const { generate, seen } = scripted([{ text: "Hi." }]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember, small],
            generate,
            resolveCandidates,
        });

        expect(seen[0]!.tools!.map((tool) => tool.name)).toEqual(["remember", "srv__small"]);
        expect(String(seen[0]!.messages[0]!.content)).not.toContain("Tools you can load");
    });
});

describe("runTextLoop repeated reads", () => {
    const readCall = ({ id, path }: { id: string; path: string }) => ({
        id,
        name: "read_file",
        arguments: JSON.stringify({ path }),
    });

    /**
     * A read that counts how often it actually ran, and a write that only
     * exists to change what a read would say.
     */
    const makeTools = () => {
        const counts = { reads: 0, writes: 0 };
        const read: HarnessTool<{ path: string }> = {
            name: "read_file",
            description: "Reads a file.",
            schema: z.object({ path: z.string() }),
            run: async ({ args }) => {
                counts.reads++;

                return `contents of ${args.path} (read ${counts.reads})`;
            },
        };
        const write: HarnessTool<{ path: string }> = {
            name: "write_file",
            description: "Writes a file.",
            schema: z.object({ path: z.string() }),
            run: async () => {
                counts.writes++;

                return "Saved.";
            },
        };

        return { tools: [read, write], counts };
    };

    test("answers a read repeated word for word from the first", async () => {
        const { tools, counts } = makeTools();
        const { generate, seen } = scripted([
            { text: null, tool_calls: [readCall({ id: "c1", path: "a.md" })] },
            { text: null, tool_calls: [readCall({ id: "c2", path: "a.md" })] },
            { text: "Done.", tool_calls: [] },
        ]);

        const result = await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Read a.md twice." }],
            tools,
            generate,
            resolveCandidates,
        });

        expect(counts.reads).toBe(1);
        expect(result.tool_uses.map((use) => use.ok)).toEqual([true, true]);

        const results = seen[2]!.messages.filter((message) => message.role == "tool");

        expect(results.map((message) => message.role == "tool" && message.content)).toEqual([
            "contents of a.md (read 1)",
            alreadyRanToolNote({ name: "read_file", step: 0 }),
        ]);
    });

    test("reads again after something may have written", async () => {
        const { tools, counts } = makeTools();
        const { generate, seen } = scripted([
            { text: null, tool_calls: [readCall({ id: "c1", path: "a.md" })] },
            { text: null, tool_calls: [{ id: "c2", name: "write_file", arguments: `{"path":"a.md"}` }] },
            { text: null, tool_calls: [readCall({ id: "c3", path: "a.md" })] },
            { text: "Done.", tool_calls: [] },
        ]);

        await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Update a.md." }],
            tools,
            generate,
            resolveCandidates,
        });

        expect(counts.reads).toBe(2);
        expect(counts.writes).toBe(1);

        const results = seen[3]!.messages.filter((message) => message.role == "tool");

        expect(results.map((message) => message.role == "tool" && message.content)).toEqual([
            "contents of a.md (read 1)",
            "Saved.",
            "contents of a.md (read 2)",
        ]);
    });

    test("reads a different file on its own", async () => {
        const { tools, counts } = makeTools();
        const { generate } = scripted([
            { text: null, tool_calls: [readCall({ id: "c1", path: "a.md" }), readCall({ id: "c2", path: "b.md" })] },
            { text: "Done.", tool_calls: [] },
        ]);

        await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Read both." }],
            tools,
            generate,
            resolveCandidates,
        });

        expect(counts.reads).toBe(2);
    });

    test("keeps its own answers apart from other runs", async () => {
        const { tools, counts } = makeTools();
        const turns = [
            { text: null, tool_calls: [readCall({ id: "c1", path: "a.md" })] },
            { text: "Done.", tool_calls: [] },
        ];
        const first = scripted(turns);

        await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Read a.md." }],
            tools,
            generate: first.generate,
            resolveCandidates,
        });

        const second = scripted(turns);

        await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Read a.md." }],
            tools,
            generate: second.generate,
            resolveCandidates,
        });

        expect(counts.reads).toBe(2);
    });

    test("traces a read it skipped as the step that answered it", async () => {
        const { tools, counts } = makeTools();
        const turns = [
            {
                text: null,
                tool_calls: [
                    readCall({ id: "c1", path: "a.md" }),
                    readCall({ id: "c2", path: "a.md" }),
                ],
            },
            { text: "Done.", tool_calls: [] },
        ];
        const { generate } = scripted(turns);
        const traces: HarnessTrace[] = [];

        await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Read a.md twice." }],
            tools,
            generate,
            resolveCandidates,
            trace: (entry) => {
                traces.push(entry);
            },
        });

        expect(counts.reads).toBe(1);

        const calls = traces.filter((entry) => entry.kind == "tool");

        expect(calls).toHaveLength(2);
        expect(calls[1]).toMatchObject({ repeat_of: 0, duration_ms: 0 });
    });
});

describe("runTextLoop trace", () => {
    test("keeps what it did as a trace: turns, tool calls and its own events", async () => {
        const { generate } = scripted([
            {
                text: "Noting that.",
                reasoning: "They told me what they drink.",
                tool_calls: [
                    { id: "c1", name: "remember", arguments: `{"note":"tea"}` },
                ],
                usage: { prompt_tokens: 10, completion_tokens: 3 },
                finish_reason: "tool_calls",
            },
            { text: "I'll remember you like tea.", finish_reason: "stop" },
        ]);
        const traces: HarnessTrace[] = [];

        const result = await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "I like tea." }],
            tools: [remember],
            generate,
            resolveCandidates,
            trace: (entry) => {
                traces.push(entry);
            },
        });

        expect(result.text).toBe("I'll remember you like tea.");
        expect(traces.map((entry) => entry.kind)).toEqual(["turn", "tool", "turn"]);
        expect(traces[0]).toMatchObject({
            kind: "turn",
            index: 0,
            text: "Noting that.",
            reasoning: "They told me what they drink.",
            model: "m",
            provider: null,
            tool_calls: [{ name: "remember", arguments: `{"note":"tea"}` }],
            usage: { prompt_tokens: 10, completion_tokens: 3 },
            finish_reason: "tool_calls",
        });
        expect(traces[1]).toMatchObject({
            kind: "tool",
            index: 0,
            name: "remember",
            arguments: `{"note":"tea"}`,
            result: "Saved.",
            ok: true,
            images: 0,
            repeat_of: null,
        });
        expect((traces[1] as { duration_ms: number }).duration_ms).toBeGreaterThanOrEqual(0);
        expect(traces[2]).toMatchObject({
            kind: "turn",
            index: 1,
            text: "I'll remember you like tea.",
            finish_reason: "stop",
        });
    });

    test("a trace that can't be kept never fails the run", async () => {
        const { generate } = scripted([{ text: "Done." }]);

        const result = await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Hello." }],
            generate,
            resolveCandidates,
            trace: () => {
                throw new Error("The database is full.");
            },
        });

        expect(result.text).toBe("Done.");
    });
});

describe("runTextLoop repeated failures", () => {
    const failing = (id: string) => ({
        id,
        name: "computer_bash",
        arguments: JSON.stringify({ command: "python3 rb.py 22" }),
    });

    const makeTools = () => {
        const counts = { commands: 0, writes: 0 };

        const bash: HarnessTool<{ command: string }> = {
            name: "computer_bash",
            description: "Runs a command.",
            schema: z.object({ command: z.string() }),
            run: async () => {
                counts.commands++;

                return "Error: Exit code: 1\nFileNotFoundError: plan/0.json";
            },
        };
        const write: HarnessTool<{ path: string }> = {
            name: "computer_write_file",
            description: "Writes a file.",
            schema: z.object({ path: z.string() }),
            run: async () => {
                counts.writes++;

                return "Written.";
            },
        };

        return { tools: [bash, write], counts };
    };

    test("answers an identical failing call from its failure, after one retry", async () => {
        const { tools, counts } = makeTools();
        const { generate, seen } = scripted([
            { tool_calls: [failing("c1")] },
            { tool_calls: [failing("c2")] },
            { tool_calls: [failing("c3")] },
            { text: "Blocked: the engine path is wrong." },
        ]);

        const result = await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Run it." }],
            tools,
            generate,
            resolveCandidates,
        });

        expect(counts.commands).toBe(1 + AppData.HarnessSameFailureRetries);
        expect(result.text).toBe("Blocked: the engine path is wrong.");

        const results = seen[3]!.messages.filter((message) => message.role == "tool");

        expect(String(results[2]!.content)).toContain("failed the same way each time");
        expect(result.tool_uses.filter((use) => !use.ok)).toHaveLength(3);
    });

    test("runs the same call again once something could have changed its answer", async () => {
        const { tools, counts } = makeTools();
        const { generate } = scripted([
            { tool_calls: [failing("c1")] },
            { tool_calls: [{ id: "c2", name: "computer_write_file", arguments: `{"path":"plan/22.json"}` }] },
            { tool_calls: [failing("c3")] },
            { text: "Done." },
        ]);

        await runTextLoop({
            system: "You are a bot.",
            messages: [{ role: "user", content: "Set the plan up, then run it." }],
            tools,
            generate,
            resolveCandidates,
        });

        expect(counts.writes).toBe(1);
        expect(counts.commands).toBe(2);
    });
});

describe("runTextLoop token warning", () => {
    test("says half the token budget is gone, once", async () => {
        const turn = {
            tool_calls: [{ id: "c", name: "remember", arguments: `{"note":"x"}` }],
            usage: { prompt_tokens: 300, completion_tokens: 1 },
        };
        const { generate, seen } = scripted([turn, turn, turn, turn, { text: "Landing it here." }]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_prompt_tokens: 1000,
            generate,
            resolveCandidates,
        });

        const warned = ({ turn }: { turn: number }) =>
            seen[turn]!.messages.filter(
                (message) =>
                    message.role == "user" &&
                    typeof message.content == "string" &&
                    message.content.includes("prompt tokens left in this run"),
            ).length;

        expect(warned({ turn: 1 })).toBe(0);
        expect(warned({ turn: 2 })).toBe(1);
        expect(warned({ turn: 4 })).toBe(1);
    });
});

describe("runTextLoop commit early", () => {
    const reading = (id: string) => ({
        tool_calls: [{ id, name: "remember", arguments: `{"note":"x"}` }],
        usage: { prompt_tokens: 300, completion_tokens: 1 },
    });
    const wrote = (id: string) => ({
        tool_calls: [{ id, name: "write_file", arguments: "{}" }],
        usage: { prompt_tokens: 300, completion_tokens: 1 },
    });
    const write_file: HarnessTool = {
        name: "write_file",
        description: "Writes a file.",
        schema: z.object({}),
        run: async () => "Written.",
    };
    const committed = ({ turn, seen }: { turn: number; seen: GenerateTextParams[] }) =>
        seen[turn]!.messages.filter(
            (message) =>
                message.role == "user" &&
                typeof message.content == "string" &&
                message.content.includes("nothing has been produced yet"),
        ).length;

    test("tells a run that has only been reading to land a piece of the work, once", async () => {
        const { generate, seen } = scripted([reading("a"), reading("b"), reading("c"), { text: "Done." }]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [remember],
            max_prompt_tokens: 1000,
            generate,
            resolveCandidates,
        });

        expect(committed({ turn: 0, seen })).toBe(0);
        expect(committed({ turn: 1, seen })).toBe(1);
        expect(committed({ turn: 3, seen })).toBe(1);
    });

    test("says nothing to a run that has already written something", async () => {
        const { generate, seen } = scripted([wrote("a"), wrote("b"), wrote("c"), { text: "Done." }]);

        await runTextLoop({
            system: "s",
            messages: [{ role: "user", content: "go" }],
            tools: [write_file],
            max_prompt_tokens: 1000,
            generate,
            resolveCandidates,
        });

        expect(committed({ turn: 1, seen })).toBe(0);
        expect(committed({ turn: 3, seen })).toBe(0);
    });
});
