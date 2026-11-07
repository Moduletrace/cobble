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
});
