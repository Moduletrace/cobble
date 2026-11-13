import { describe, expect, test } from "bun:test";
import chatroomOpenJobsWarning from "@/src/utils/chatroom-open-jobs-warning";

/**
 * A room can't be closed over a bot still working in it: closing cancels
 * its job (`cancelChatroomJobs`). A coordinator once answered a room while
 * the Software Engineer ran the very work it was asked for, the run died
 * with "The chatroom closed", and the answer said the tasks were picked up.
 * The warning is what the tool throws instead, so it has to name who is
 * busy and how to go on.
 */
describe("chatroomOpenJobsWarning", () => {
    test("says nothing when nothing runs", () => {
        expect(chatroomOpenJobsWarning({ jobs: [], closing: "Answering" })).toBe("");
    });

    test("names the bot, its run and what it was about to do", () => {
        const warning = chatroomOpenJobsWarning({
            jobs: [{ id: 295, bot_name: "Software Engineer", status: "processing" }],
            closing: "Answering",
        });

        expect(warning).toContain("Still working here: Software Engineer (run #295, processing).");
        expect(warning).toContain("Answering closes the room and cancels that run, so the work is lost.");
        expect(warning).toContain("close_anyway: true");
    });

    test("lists every job still open, in the order given", () => {
        const warning = chatroomOpenJobsWarning({
            jobs: [
                { id: 12, bot_name: "Writer", status: "pending" },
                { id: 13, bot_name: "Reviewer", status: "processing" },
            ],
            closing: "Turning it down",
        });

        expect(warning).toContain("Writer (run #12, pending), Reviewer (run #13, processing)");
        expect(warning).toContain("Turning it down closes the room");
    });

    test("copes with a job whose bot is gone", () => {
        const warning = chatroomOpenJobsWarning({ jobs: [{ id: 7, bot_name: null }], closing: "Answering" });

        expect(warning).toContain("Still working here: A bot (run #7).");
    });
});