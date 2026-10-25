import { describe, expect, test } from "bun:test";
import type { BotMessageWithAttachments, ConversationHistory } from "@/src/types";
import mergeLoadedHistory from "./merge-loaded-history";

function message({ id, session_id = 1 }: { id: number; session_id?: number }) {
    return { id, session_id, author: "bot", text: `#${id}` } as BotMessageWithAttachments;
}

function history({ ids, session_id = 1 }: { ids: number[]; session_id?: number }) {
    return {
        session: { id: session_id },
        messages: ids.map((id) => message({ id, session_id })),
        has_more: false,
        task: null,
    } as ConversationHistory;
}

const ids = (messages: BotMessageWithAttachments[]) => messages.map((m) => m.id);

describe("mergeLoadedHistory", () => {
    test("an empty thread takes the history", () => {
        expect(ids(mergeLoadedHistory({ shown: [], history: history({ ids: [1, 2] }) }))).toEqual([1, 2]);
    });

    test("keeps what arrived after the history, once", () => {
        const shown = [message({ id: 2 }), message({ id: 3 })];

        expect(ids(mergeLoadedHistory({ shown, history: history({ ids: [1, 2] }) }))).toEqual([1, 2, 3]);
    });

    test("an older copy of the thread gives way", () => {
        const shown = [message({ id: 1 }), message({ id: 2 })];

        expect(ids(mergeLoadedHistory({ shown, history: history({ ids: [2, 4, 5] }) }))).toEqual([2, 4, 5]);
    });

    test("another session's messages give way", () => {
        const shown = [message({ id: 9, session_id: 1 })];

        expect(
            ids(mergeLoadedHistory({ shown, history: history({ ids: [10], session_id: 2 }) })),
        ).toEqual([10]);
    });
});
