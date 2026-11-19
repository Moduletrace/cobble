import { afterAll, describe, expect, mock, test } from "bun:test";

/**
 * The same record helpers `review-bot-reply.test.ts` stands in for: this
 * checks that a reply and a task report go through that review, with the
 * run's own bot, user, session and folders.
 */
mock.module("@/src/functions/backend/db/bots-queue/has-open-work", () => ({
    default: async () => false,
}));
mock.module("@/src/functions/backend/db/bot-files/grab-bot-file", () => ({
    default: async () => null,
}));
mock.module("@/src/functions/backend/db/bot-files/grab-bot-file-scope", () => ({
    default: async () => null,
}));
mock.module("@/src/functions/backend/db/bot-files/user-reaches-file-scope", () => ({
    default: async () => false,
}));
mock.module("@/src/functions/backend/db/tasks/assert-user-reaches-task", () => ({
    default: async () => null,
}));
mock.module("@/src/functions/backend/db/bot-graphics/grab-bot-graphic", () => ({
    default: async () => null,
}));

afterAll(() => {
    mock.restore();
});

describe("reviewRunAnswer", () => {
    test("sends a task report back for a file the user can't open", async () => {
        const { default: reviewRunAnswer } = await import("./review-run-answer");
        const review = reviewRunAnswer({ bot_id: 4, user_id: 2, session_id: 9, scopes: [] });

        const note = await review({ text: "Saved it as [file:41].", tool_uses: [] });

        expect(note).toContain("[file:41]");
        expect(note).toContain("was not sent");
    });

    test("lets an answer through when the record holds up", async () => {
        const { default: reviewRunAnswer } = await import("./review-run-answer");
        const review = reviewRunAnswer({ bot_id: 4, user_id: 2, session_id: 9, scopes: [] });

        expect(await review({ text: "Nothing named, nothing started.", tool_uses: [] })).toBeNull();
    });
});
