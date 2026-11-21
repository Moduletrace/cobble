import { describe, expect, test } from "bun:test";
import type { HarnessTool } from "../../types";
import filterPlanModeTools, { PlanModeToolNames } from "./plan-mode-tools";

const tool = (name: string): HarnessTool => ({
    name,
    description: name,
    run: async () => "",
});

describe("Plan mode's tool allowlist", () => {
    test("keeps the reads and the mode's own cards", () => {
        const kept = filterPlanModeTools({
            tools: [tool("read_file"), tool("list_tasks"), tool("create_plan"), tool("send_reply"), tool("ask_user")],
        });

        expect(kept.map((kept_tool) => kept_tool.name)).toEqual(["read_file", "list_tasks", "create_plan", "send_reply", "ask_user"]);
    });

    test("drops every write, computer, browser and extension tool", () => {
        const kept = filterPlanModeTools({
            tools: [
                tool("write_file"),
                tool("import_file"),
                tool("update_memory"),
                tool("create_task"),
                tool("create_graphic"),
                tool("react_to_message"),
                tool("ask_bot"),
                tool("start_task"),
                tool("delegate_task"),
                tool("hand_over_task"),
                tool("computer_bash"),
                tool("browser_navigate"),
                tool("load_tools"),
                tool("show_secret"),
                tool("send_message"),
            ],
        });

        expect(kept).toEqual([]);
    });

    test("holds a tool nobody named yet out, so the list stays an allowlist", () => {
        const tools = [tool("read_file"), tool("a_tool_shipped_later")];

        expect(filterPlanModeTools({ tools }).map((kept_tool) => kept_tool.name)).toEqual(["read_file"]);
    });

    test("every allowed name is lowercase with underscores", () => {
        for (const name of PlanModeToolNames) {
            expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
        }
    });
});