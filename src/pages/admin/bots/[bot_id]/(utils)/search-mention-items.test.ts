import { describe, expect, test } from "bun:test";
import type { BotWithLastMessage, WorkspaceWithActivity } from "@/src/types";
import searchMentionItems from "./search-mention-items";

const bots = [
    { id: 1, name: "Cobble" },
    { id: 2, name: "Researcher" },
    { id: 3, name: "Archive reader" },
] as BotWithLastMessage[];

const workspaces = [
    { id: 1, name: "Launch", unread: 0 },
    { id: 2, name: "Old launch", archived: 1, unread: 0 },
] as WorkspaceWithActivity[];

describe("searchMentionItems", () => {
    test("puts names starting with the query first", () => {
        const items = searchMentionItems({ kind: "bot", query: "r", bots, workspaces });

        expect(items.map((item) => item.id)).toEqual([2, 3]);
    });

    test("offers every bot for an empty query", () => {
        expect(searchMentionItems({ kind: "bot", query: "", bots, workspaces })).toHaveLength(3);
    });

    test("leaves archived workspaces out", () => {
        const items = searchMentionItems({ kind: "workspace", query: "launch", bots, workspaces });

        expect(items.map((item) => item.label)).toEqual(["Launch"]);
    });
});
