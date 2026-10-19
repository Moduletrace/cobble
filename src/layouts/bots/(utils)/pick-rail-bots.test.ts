import { describe, expect, test } from "bun:test";
import type { BotWithLastMessage } from "@/src/types";
import pickRailBots from "./pick-rail-bots";

const bot = (id: number, extra: Partial<BotWithLastMessage> = {}): BotWithLastMessage => ({
    id,
    name: `Bot ${id}`,
    face: "idle",
    ...extra,
});

describe("pickRailBots", () => {
    test("lists the most recent up to the limit and hides the rest", () => {
        const { shown, hidden } = pickRailBots({ workers: [bot(1), bot(2), bot(3)], limit: 2 });

        expect(shown.map((b) => b.id)).toEqual([1, 2]);
        expect(hidden.map((b) => b.id)).toEqual([3]);
    });

    test("keeps an older bot that's open, unread or needs you", () => {
        const { shown, hidden } = pickRailBots({
            workers: [bot(1), bot(2), bot(3, { unread: 1 }), bot(4, { face: "needs-you" }), bot(5), bot(6)],
            selected_id: 5,
            limit: 1,
        });

        expect(shown.map((b) => b.id)).toEqual([1, 3, 4, 5]);
        expect(hidden.map((b) => b.id)).toEqual([2, 6]);
    });
});
