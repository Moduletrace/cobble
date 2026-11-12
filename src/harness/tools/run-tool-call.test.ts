import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import HarnessError from "../harness-error";
import type { HarnessTool } from "../types";
import runToolCall from "./run-tool-call";
import toolDefinition from "./tool-definition";

const echo: HarnessTool<{ text: string }> = {
    name: "echo",
    description: "Says it back.",
    schema: z.object({ text: z.string().min(1) }),
    run: async ({ args }) => args.text,
};

const failing: HarnessTool = {
    name: "fail",
    description: "Always fails.",
    schema: z.object({}),
    run: async () => {
        throw new Error("disk full");
    },
};

const signal = new AbortController().signal;
const shot: HarnessTool = {
    name: "shot",
    description: "Takes screenshots.",
    schema: z.object({}),
    run: async () => ({
        text: "x".repeat(AppData.HarnessToolResultMaxChars + 5),
        images: Array.from({ length: AppData.HarnessToolMaxImages + 2 }, (_, index) => ({
            url: `data:image/png;base64,${index}`,
            focus: "the page",
        })),
    }),
};

const run = (name: string, args: string) =>
    runToolCall({
        call: { id: "1", name, arguments: args },
        tools: [echo, failing, shot],
        signal,
    });
const call = async (name: string, args: string) => (await run(name, args)).text;

describe("runToolCall", () => {
    test("runs the tool with validated arguments", async () => {
        expect(await call("echo", `{"text":"hi"}`)).toBe("hi");
    });

    test("reports problems to the model instead of throwing", async () => {
        expect(await call("nope", "{}")).toContain(`no tool called "nope"`);
        expect(await call("echo", "{bad")).toContain("weren't valid JSON");
        expect(await call("echo", `{"text":""}`)).toContain(
            "Wrong arguments for echo",
        );
        expect(await call("fail", "")).toBe("Error: disk full");
    });

    test("cuts long results, keeping their start and their end", async () => {
        const long = "x".repeat(AppData.HarnessToolResultMaxChars + 5);
        const result = await call("echo", JSON.stringify({ text: long }));

        expect(result).toContain("[... 5 characters left out. ...]");
        expect(result).toStartWith("x".repeat(100));
        expect(result).toEndWith("x".repeat(100));
        expect(result.length).toBeLessThanOrEqual(AppData.HarnessToolResultMaxChars);
    });

    test("keeps the end of a long command's output, where its totals are", async () => {
        /**
         * A `du`/`find` sweep: the biggest entries and the sum are on the
         * last lines, so a head-only cut made each run re-run it.
         */
        const sweep = `${"4.0K\t/usr/lib/x\n".repeat(4000)}112G\t/home/gem/workspace\n`;
        const result = await call("echo", JSON.stringify({ text: sweep }));

        expect(result).toStartWith("4.0K");
        expect(result).toContain("characters left out");
        expect(result).toEndWith("112G\t/home/gem/workspace\n");
    });

    test("cuts a browser tool's result sooner, saying how to see the rest", async () => {
        const browser: HarnessTool<{ text: string }> = { ...echo, name: "pc__browser_evaluate" };
        const long = "x".repeat(AppData.HarnessBrowserResultMaxChars + 7);
        const { text } = await runToolCall({
            call: { id: "1", name: browser.name, arguments: JSON.stringify({ text: long }) },
            tools: [browser],
            signal,
        });

        expect(text).toStartWith("x".repeat(100));
        expect(text).toContain("[... 7 characters left out. ...]");
        expect(text).toContain("Narrow the call");
        expect(text).toEndWith("x".repeat(100));
    });

    test("passes images on, capped and marked as a tool's", async () => {
        const result = await run("shot", "{}");

        expect(result.text).toContain("[... 5 characters left out. ...]");
        expect(result.images).toHaveLength(AppData.HarnessToolMaxImages);
        expect(result.images[0]).toEqual({
            url: "data:image/png;base64,0",
            focus: "the page",
            from_tool: true,
        });
        expect((await run("echo", `{"text":"hi"}`)).images).toEqual([]);
    });

    test("throws when cancelled", async () => {
        const controller = new AbortController();
        const slow: HarnessTool = {
            ...failing,
            run: async () => {
                controller.abort();
                throw new Error("stopped");
            },
        };

        const error = await runToolCall({
            call: { id: "1", name: "fail", arguments: "{}" },
            tools: [slow],
            signal: controller.signal,
        }).catch((e) => e);

        expect(error).toBeInstanceOf(HarnessError);
        expect(error.code).toBe("aborted");
    });
});

describe("toolDefinition", () => {
    test("describes the arguments as JSON schema", () => {
        expect(toolDefinition({ tool: echo })).toEqual({
            name: "echo",
            description: "Says it back.",
            parameters: {
                type: "object",
                properties: { text: { type: "string", minLength: 1 } },
                required: ["text"],
            },
        });
    });
});
