import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import delegateTaskTool from "./delegate-task-tool";

const worker = { id: 5, name: "Researcher", role: "research", kind: "worker" } as BUN_SQLITE_COBBLE_BOTS;
const workspace = { id: 3, name: "Launch", archived: 0 } as BUN_SQLITE_COBBLE_WORKSPACES;
const signal = new AbortController().signal;

function coordinatorTool({
    workspace_id,
    workers = [worker],
    workspaces = [workspace],
}: { workspace_id?: number; workers?: BUN_SQLITE_COBBLE_BOTS[]; workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[] } = {}) {
    return delegateTaskTool({
        user_id: 1,
        requester_id: 1,
        session_id: 10,
        workspace_id: workspace_id ?? null,
        requester_name: "Coordinator",
        workers,
        workspaces,
    });
}

/**
 * The tool's own confines, kept to what needs no database: the argument it
 * accepts and the refusal that keeps a workspace hand-over in its
 * workspace. Every run that gets past those reaches the DB.
 */
describe("delegateTaskTool", () => {
    test("takes an optional workspace the task runs in", () => {
        const tool = coordinatorTool();

        expect(tool.name).toBe("delegate_task");
        expect(tool.schema?.safeParse({ bot_id: 5, title: "Dig", instructions: "Read the docs." }).success).toBe(true);
        expect(
            tool.schema?.safeParse({ bot_id: 5, title: "Dig", instructions: "Read the docs.", workspace_id: 3 }).success,
        ).toBe(true);
    });

    test("names the workspaces it can hand work into", () => {
        expect(coordinatorTool().description).toContain("3: Launch");
    });

    test("in a workspace, says the task runs there and offers no other", () => {
        const tool = coordinatorTool({ workspace_id: 3 });

        expect(tool.description).toContain("runs there");
        expect(tool.schema?.safeParse({ bot_id: 5, title: "Dig", instructions: "x", workspace_id: 9 }).success).toBe(
            true,
        );
    });

    test("refuses to move a hand-over out of the workspace it came from", async () => {
        await expect(
            coordinatorTool({ workspace_id: 3 }).run({
                args: { bot_id: 5, title: "Dig", instructions: "x", workspace_id: 9 },
                signal,
            }),
        ).rejects.toThrow(/runs in that workspace/);
    });

    test("accepts the workspace it came from", async () => {
        /** Reaches the DB and fails there for a test id, never on the guard. */
        await expect(
            coordinatorTool({ workspace_id: 3 }).run({
                args: { bot_id: 5, title: "Dig", instructions: "x", workspace_id: 3 },
                signal,
            }),
        ).rejects.not.toThrow(/runs in that workspace/);
    });

    test("a workspace admin can only hand work to the bots it may direct", async () => {
        const tool = delegateTaskTool({
            user_id: 1,
            requester_id: 7,
            session_id: 10,
            workspace_id: 3,
            requester_name: "Lead",
            workers: [worker],
            grabTargets: async () => [worker],
        });

        await expect(
            tool.run({ args: { bot_id: 8, title: "Dig", instructions: "x" }, signal }),
        ).rejects.toThrow(/No crew member has id 8 in workspace 3. Crew: 5: Researcher/);
    });

    test("takes the id of a task already on a list in place of a brief", () => {
        const tool = coordinatorTool();

        expect(tool.schema?.safeParse({ bot_id: 5, task_id: 12 }).success).toBe(true);
        expect(tool.schema?.safeParse({ bot_id: 5, task_id: 12, instructions: "Start with the intro." }).success).toBe(
            true,
        );
        expect(tool.description).toContain("task_id");
    });

    test("without a task_id, still needs a title and instructions", async () => {
        const tool = delegateTaskTool({
            user_id: 1,
            requester_id: 1,
            session_id: 10,
            requester_name: "Coordinator",
            workers: [worker],
            grabTargets: async () => [worker],
        });

        await expect(tool.run({ args: { bot_id: 5 }, signal })).rejects.toThrow(/Give a title and instructions/);
    });
});
