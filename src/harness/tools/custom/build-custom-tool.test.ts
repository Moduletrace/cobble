import { afterAll, describe, expect, mock, test } from "bun:test";
import type { CustomToolPromptConfig, CustomToolRecord } from "@/src/types";
import type { HarnessMessage } from "../../types";

let sent: HarnessMessage[] = [];

mock.module("../../text/generate-text", () => ({
    default: async ({ messages }: { messages: HarnessMessage[] }) => {
        sent = messages;
        return { text: "the answer" };
    },
}));

const { default: buildCustomTool } = await import("./build-custom-tool");

afterAll(() => mock.restore());

const signal = new AbortController().signal;

function promptTool(): CustomToolRecord {
    return {
        id: 1,
        name: "summarise",
        description: "Summarises something",
        kind: "prompt",
        config: { prompt: "Password: {{args.password}}" } as CustomToolPromptConfig,
        parameters: { type: "object", properties: { password: { type: "string" } } },
        all_bots: false,
        enabled: true,
        status: "untested",
        last_error: "",
        last_checked_at: null,
        updated_at: null,
    };
}

describe("buildCustomTool fills {{env.KEY}} in the arguments", () => {
    test("an argument template is filled before the tool runs", async () => {
        sent = [];

        const tool = buildCustomTool({
            tool: promptTool(),
            envs: [],
            arg_envs: [{ key: "MAIL_PASSWORD", value: "hunter2secret", secret: true }],
            record: false,
        });

        await tool!.run({ args: { password: "{{env.MAIL_PASSWORD}}" }, signal });

        expect(String(sent[0]?.content)).toBe("Password: [MAIL_PASSWORD]");
    });

    test("a prompt tool gets a secret's marker, never its value", async () => {
        sent = [];

        const tool = buildCustomTool({
            tool: promptTool(),
            envs: [],
            arg_envs: [{ key: "MAIL_PASSWORD", value: "hunter2secret", secret: true }],
            record: false,
        });

        const result = await tool!.run({ args: { password: "{{env.MAIL_PASSWORD}}" }, signal });

        expect(result).not.toContain("hunter2secret");
        expect(String(sent[0]?.content)).not.toContain("hunter2secret");
    });

    test("an argument with no template is passed as it was sent", async () => {
        sent = [];

        const tool = buildCustomTool({ tool: promptTool(), envs: [], arg_envs: [], record: false });

        await tool!.run({ args: { password: "typed by hand" }, signal });

        expect(String(sent[0]?.content)).toBe("Password: typed by hand");
    });

    test("a key that isn't set names Settings > Environment", async () => {
        const tool = buildCustomTool({ tool: promptTool(), envs: [], arg_envs: [], record: false });

        await expect(tool!.run({ args: { password: "{{env.NOT_SET}}" }, signal })).rejects.toThrow(
            /NOT_SET isn't set. Add it in Settings, under Environment/,
        );
    });
});