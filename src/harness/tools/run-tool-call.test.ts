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
const call = (name: string, args: string) =>
    runToolCall({
        call: { id: "1", name, arguments: args },
        tools: [echo, failing],
        signal,
    });

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

    test("cuts long results", async () => {
        const long = "x".repeat(AppData.HarnessToolResultMaxChars + 5);
        const result = await call("echo", JSON.stringify({ text: long }));

        expect(result).toEndWith("[Cut: 5 more characters.]");
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
