import { expect, test } from "bun:test";
import isWritingTool, { WritingToolNames } from "./writing-tool-names";

test("counts the tools that leave something behind", () => {
    for (const name of ["write_file", "import_file", "computer_edit_file", "update_task", "start_task", "set_picture"]) {
        expect(isWritingTool({ name })).toBe(true);
    }
});

test("counts none of the tools that only read", () => {
    for (const name of ["read_file", "list_files", "computer_read_file", "list_tasks", "search_computers", "load_tools"]) {
        expect(isWritingTool({ name })).toBe(false);
    }
});

test("leaves computer_bash out, so a shell-driven run can still be told to land the work", () => {
    expect(isWritingTool({ name: "computer_bash" })).toBe(false);
    expect(WritingToolNames.includes("computer_bash")).toBe(false);
});