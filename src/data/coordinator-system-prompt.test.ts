import { describe, expect, test } from "bun:test";
import { CoordinatorSystemPrompt } from "./coordinator-system-prompt";
import { SiteData } from "./site-data";

/**
 * The prompt's own guarantees: it is markdown that names the product, it
 * keeps the real task statuses and the reply/task split, and every tool it
 * names is one a coordinator actually gets.
 */
describe("CoordinatorSystemPrompt", () => {
    test("is markdown that opens with the coordinator heading", () => {
        expect(CoordinatorSystemPrompt.startsWith("# You Are the Coordinator")).toBe(
            true,
        );
        expect(CoordinatorSystemPrompt).toContain("\n## 1. ");
    });

    test("names the product from SiteData", () => {
        expect(CoordinatorSystemPrompt).toContain(SiteData["SiteName"]);
    });

    test("has no em dashes", () => {
        expect(CoordinatorSystemPrompt).not.toContain(String.fromCharCode(0x2014));
    });

    test("uses the real task statuses, not invented ones", () => {
        for (const status of ["todo", "doing", "blocked", "done", "cancelled"]) {
            expect(CoordinatorSystemPrompt).toContain(status);
        }

        // Words from the previous draft that no tool accepts.
        for (const stale of ["Verified:", "**Requested:**", "**Queued:**"]) {
            expect(CoordinatorSystemPrompt).not.toContain(stale);
        }
    });

    test("names the tools it tells the coordinator to use", () => {
        const tools = [
            "start_task",
            "delegate_task",
            "hand_over_schedule",
            "create_bot",
            "create_workspace",
            "update_workspace",
            "set_bot_workspace_instructions",
            "update_instructions",
            "update_memory",
            "list_tasks",
            "update_task",
            "create_schedule",
            "list_schedules",
            "update_schedule",
            "delete_schedule",
            "search_computers",
            "ask_user_to_take_over",
            "write_file",
            "make_pdf",
            "generate_image",
        ];

        for (const tool of tools) {
            expect(CoordinatorSystemPrompt).toContain(tool);
        }
    });
});
