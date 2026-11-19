import { afterAll, describe, expect, mock, test } from "bun:test";

/**
 * The review reads the app's record through the database helpers; here they
 * are kept to what each case needs, so the check itself is what's tested.
 * The graphic the user can open is id 2.
 */
const open_graphics = new Set<number>([2]);

let open_work = false;
const open_work_calls: Array<{ bot_id: number | string; session_id: number | string; exclude_job_id?: number | string }> = [];

mock.module("@/src/functions/backend/db/bots-queue/has-open-work", () => ({
    default: async (params: { bot_id: number | string; session_id: number | string; exclude_job_id?: number | string }) => {
        open_work_calls.push(params);
        return open_work;
    },
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
    default: async ({ graphic_id }: { graphic_id: number | string }) =>
        open_graphics.has(Number(graphic_id)) ? { id: Number(graphic_id) } : null,
}));

afterAll(() => {
    mock.restore();
});

const review = async ({
    text,
    tool_uses = [],
    status,
    job_id,
}: {
    text: string;
    tool_uses?: { name: string; ok: boolean }[];
    status?: "done" | "working" | "blocked";
    job_id?: number;
}) => {
    const { default: reviewBotReply } = await import("./review-bot-reply");

    return reviewBotReply({ text, tool_uses, bot_id: 1, user_id: 1, session_id: 123, scopes: [], status, job_id });
};

describe("reviewBotReply", () => {
    /**
     * The coordinator's replies 641 and 643: the model wrote `[suggestion:11]`
     * and `[suggestion:12]` itself, pattern-matched off the `[suggestion:10]`
     * the app had added to an earlier message. Neither run called
     * `suggest_next_steps`, so no row existed and the buttons read
     * "next steps 11 (not available)".
     */
    test("sends back an answer that writes a suggestion ref itself", async () => {
        const note = await review({
            text: "Here's the picture you asked for.\n\n[suggestion:11]",
            tool_uses: [{ name: "generate_image", ok: true }],
        });

        expect(note).toContain("[suggestion:11]");
        expect(note).toContain("suggest_next_steps");
    });

    test("sends it back even when suggest_next_steps ran: the app adds that ref itself", async () => {
        const note = await review({
            text: "Done. [suggestion:11]",
            tool_uses: [{ name: "suggest_next_steps", ok: true }],
        });

        expect(note).toContain("suggest_next_steps");
    });

    test("sends back question and plan refs written by hand too", async () => {
        const question = await review({ text: "A few things first. [question:4]" });
        const plan = await review({ text: "I wrote the plan. [plan:7]" });

        expect(question).toContain("ask_user");
        expect(plan).toContain("create_plan");
    });

    test("faults a graphic ref that names no graphic the user can open", async () => {
        const note = await review({ text: "The chart: [graphic:9]" });

        expect(note).toContain("[graphic:9]");
    });

    test("passes a graphic the user can open, and an answer with no refs", async () => {
        expect(await review({ text: "The chart: [graphic:2]", tool_uses: [{ name: "create_graphic", ok: true }] })).toBeNull();
        expect(await review({ text: "Here's the picture you asked for." })).toBeNull();
    });

    /**
     * Session 75 message 951: the run deleted the old files, said it was
     * generating the banner next, and stopped. The status is now part of
     * the answer, so `done` is a contradiction the review can name even
     * while another run is open.
     */
    test("faults a done message that says work is under way", async () => {
        const note = await review({
            text: "Now generating the single centered 6% signpost hero with the image generation tool.",
            status: "done",
            job_id: 560,
        });

        expect(note).toContain(`status "done"`);
    });

    test("passes a working message when a run is open, excluding this run's own job", async () => {
        open_work = true;
        open_work_calls.length = 0;

        const note = await review({
            text: "I'm generating the banner now.",
            status: "working",
            job_id: 560,
        });

        expect(note).toBeNull();
        expect(open_work_calls[0]).toEqual({ bot_id: 1, session_id: 123, exclude_job_id: 560 });
        open_work = false;
    });
});
