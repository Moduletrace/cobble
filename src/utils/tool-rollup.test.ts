import { describe, expect, test } from "bun:test";
import toolRollup from "./tool-rollup";

const log = (...uses: { name: string; ok?: boolean }[]) => JSON.stringify(uses);

describe("toolRollup", () => {
    test("no record of a run", () => {
        expect(toolRollup({ tool_log: null })).toBe(null);
        expect(toolRollup({ tool_log: "" })).toBe(null);
        expect(toolRollup({ tool_log: "not json" })).toBe(null);
        expect(toolRollup({ tool_log: `{"a":1}` })).toBe(null);
    });

    test("counts calls by tool, most used first", () => {
        const rollup = toolRollup({
            tool_log: log(
                { name: "computer_bash", ok: true },
                { name: "start_task", ok: true },
                { name: "computer_bash", ok: true },
                { name: "computer_bash", ok: false },
            ),
        });

        expect(rollup).toEqual({
            calls: 4,
            failed: 1,
            tools: [
                { name: "computer_bash", label: "Running a command", count: 3, failed: 1 },
                { name: "start_task", label: "Starting a task", count: 1, failed: 0 },
            ],
        });
    });

    test("labels a browser tool and an unknown one", () => {
        const rollup = toolRollup({
            tool_log: log({ name: "browser_navigate", ok: true }, { name: "exa__search", ok: true }),
        });

        expect(rollup?.tools).toEqual([
            { name: "browser_navigate", label: "Using the browser", count: 1, failed: 0 },
            { name: "exa__search", label: "Using Exa (search)", count: 1, failed: 0 },
        ]);
    });

    test("skips a use with no name", () => {
        const rollup = toolRollup({ tool_log: JSON.stringify([{ ok: true }, { name: "write_file" }]) });

        expect(rollup?.calls).toBe(1);
        expect(rollup?.tools.map((tool) => tool.name)).toEqual(["write_file"]);
    });
});