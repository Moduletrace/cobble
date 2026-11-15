import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import type { TaskFile } from "@/src/types";
import describeTaskLog from "./describe-task-log";

const task = { id: 27, status: "doing", title: "Aspen Dental", bot_id: 21, workspace_id: 3 } as BUN_SQLITE_COBBLE_TASKS;

describe("describeTaskLog", () => {
    test("lists what's filed, bot files by their ref", () => {
        const files = [
            { id: 1, task_id: 27, media_id: 9, bot_file_id: 303, kind: "deliverable", name: "v1.png" },
            { id: 2, task_id: 27, media_id: 10, kind: "reference", name: "brief.pdf" },
        ] as TaskFile[];

        const text = describeTaskLog({ task, notes: [], files, bot_id: 21 });

        expect(text).toContain("Files (2):");
        expect(text).toContain("- deliverable: [file:303] v1.png");
        expect(text).toContain("- reference: the user's upload brief.pdf");
    });

    test("leaves the files out when there are none", () => {
        expect(describeTaskLog({ task, notes: [], bot_id: 21 })).not.toContain("Files");
    });

    test("a subtask says which task it belongs to and that the parent stays open", () => {
        const text = describeTaskLog({
            task: { ...task, parent_task_id: 12, parent_title: "Ship the release" },
            notes: [],
            bot_id: 21,
        });

        expect(text).toContain('A subtask of task #12 "Ship the release"');
        expect(text).toContain("don't mark it done from here");
    });

    test("a split task lists its subtasks with their owners and which are open", () => {
        const text = describeTaskLog({
            task: { ...task, bot_id: "", workspace_id: 3 },
            notes: [],
            bot_id: 21,
            parts: [
                { id: 31, status: "doing", title: "The intro", bot_id: 21, bot_name: "Software Engineer" },
                { id: 32, status: "done", title: "The appendix", bot_id: 22, bot_name: "SEO Expert" },
            ],
        });

        expect(text).toContain("Subtasks (2):");
        expect(text).toContain("- #31 [doing] (open) The intro, Software Engineer (yours)");
        expect(text).toContain("- #32 [done] The appendix, SEO Expert");
    });
});
