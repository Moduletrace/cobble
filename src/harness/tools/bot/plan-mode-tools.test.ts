import { describe, expect, test } from "bun:test";
import type { HarnessTool } from "../../types";
import gatePlanModeTools, { PlanModeToolNames } from "./plan-mode-tools";

const tool = (name: string): HarnessTool => ({
    name,
    description: `${name} description`,
    run: async () => `${name} ran`,
});

const runTool = (planned: HarnessTool) => planned.run({ args: {}, signal: new AbortController().signal });

describe("Plan mode's tool gate", () => {
    test("keeps every tool listed, so a write is seen and refused rather than missing", () => {
        const names = ["read_file", "list_tasks", "create_plan", "write_file", "propose_custom_tool", "computer_bash", "load_tools"];

        const planned = gatePlanModeTools({ tools: names.map((name) => tool(name)) });

        expect(planned.map((planned_tool) => planned_tool.name)).toEqual(names);
    });

    test("leaves the reads and the mode's own cards running", async () => {
        const planned = gatePlanModeTools({
            tools: [tool("read_file"), tool("list_tasks"), tool("create_plan"), tool("send_reply"), tool("ask_user")],
        });

        for (const planned_tool of planned) {
            expect(await runTool(planned_tool)).toBe(`${planned_tool.name} ran`);
        }
    });

    test("refuses every write, computer, browser and extension tool with the Plan mode reason", async () => {
        const blocked = [
            "write_file",
            "import_file",
            "update_memory",
            "create_task",
            "create_graphic",
            "react_to_message",
            "ask_bot",
            "start_task",
            "delegate_task",
            "hand_over_task",
            "computer_bash",
            "browser_navigate",
            "load_tools",
            "show_secret",
            "send_message",
            "propose_custom_tool",
        ];

        const planned = gatePlanModeTools({ tools: blocked.map((name) => tool(name)) });

        for (const planned_tool of planned) {
            const refusal = await runTool(planned_tool).catch((error: Error) => error.message);

            expect(refusal).toContain("Plan mode is on for this reply");
            expect(refusal).toContain(`${planned_tool.name} did not run`);
            expect(refusal).toContain("turn Plan mode off (Tab)");
        }
    });

    test("keeps a blocked tool's description, schema and deferral, so the model still sees what it is", async () => {
        const deferred: HarnessTool = {
            ...tool("browser_navigate"),
            description: "Open a page in the browser",
            parameters: { type: "object" },
            deferred: true,
            timeout_ms: 5_000,
        };

        const planned = gatePlanModeTools({ tools: [deferred] })[0]!;

        expect(planned.description).toBe("Open a page in the browser");
        expect(planned.parameters).toEqual({ type: "object" });
        expect(planned.deferred).toBe(true);
        expect(planned.timeout_ms).toBe(5_000);
        expect(planned.run).not.toBe(deferred.run);
    });

    test("holds a tool nobody named yet off, so the list stays an allowlist", async () => {
        const [planned] = gatePlanModeTools({ tools: [tool("a_tool_shipped_later")] });

        await expect(runTool(planned!)).rejects.toThrow("a_tool_shipped_later did not run");
    });

    test("every allowed name is lowercase with underscores", () => {
        for (const name of PlanModeToolNames) {
            expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
        }
    });
});