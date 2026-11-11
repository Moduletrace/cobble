import { afterAll, describe, expect, mock, test } from "bun:test";
import type { HarnessTool } from "../../types";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";

/**
 * The coordinator keeps the install's skills, MCP servers and tools
 * wherever it works. Its workspace conversation is where a runbook for
 * that workspace's crew gets written, so the branch that returns early for
 * a workspace must still carry `grabCoordinatorExtensionTools`: a
 * coordinator asked to make a skill there once had no tool to make one
 * with, and wrote a file into its folder instead.
 *
 * Everything the tool list would read from the database is mocked, so this
 * suite checks the list's structure alone: which branch pushed what.
 */
const marker = ({ name }: { name: string }): HarnessTool => ({
    name,
    description: `${name} marker`,
    run: async () => "ok",
});

/**
 * What `grabCrewWorkers` answers, per test: a workspace with no worker is
 * the branch that returned before the extension tools were pushed.
 */
let workers: BUN_SQLITE_COBBLE_BOTS[] = [{ id: 5, name: "A worker", kind: "worker" }];

mock.module("./extensions/grab-coordinator-extension-tools", () => ({
    default: async () => [marker({ name: "list_extensions" }), marker({ name: "propose_skill" })],
}));
mock.module("./grab-bot-tools", () => ({
    default: async () => [marker({ name: "update_memory" })],
}));
mock.module("@/src/functions/backend/db/workspaces/grab-user-workspaces", () => ({
    default: async () => [{ id: 11, name: "A workspace", archived: 0 }],
}));
mock.module("@/src/functions/backend/db/bots/grab-crew-workers", () => ({
    default: async () => workers,
}));

const grabBotChatTools = (await import("./grab-bot-chat-tools")).default;

afterAll(() => {
    mock.restore();
});

async function names({ workspace_id }: { workspace_id: number | null }) {
    const coordinator = {
        bot_types: [],
        is_coordinator: true,
        admin_workspace_ids: [],
        is_workspace_admin: false,
        can: () => true,
    };

    const tools = await grabBotChatTools({
        bot: { id: 1, kind: "coordinator", name: "Coordinator" },
        powers: coordinator,
        user_id: 1,
        computers: [],
        session_id: 9,
        workspace_id,
        onPropose: () => {},
    });

    return tools.map((tool) => tool.name);
}

describe("grabBotChatTools", () => {
    test("the coordinator in a workspace reaches the install's skills, servers and tools", async () => {
        workers = [{ id: 5, name: "A worker", kind: "worker" }];

        const list = await names({ workspace_id: 11 });

        expect(list).toContain("list_extensions");
        expect(list).toContain("propose_skill");
    });

    test("a workspace with no worker still gets them, before the empty-crew return", async () => {
        workers = [];

        const list = await names({ workspace_id: 11 });

        expect(list).toContain("list_extensions");
        expect(list).toContain("propose_skill");
    });

    test("its own chat carries them too", async () => {
        workers = [{ id: 5, name: "A worker", kind: "worker" }];

        const list = await names({ workspace_id: null });

        expect(list).toContain("list_extensions");
        expect(list).toContain("propose_skill");
    });
});
