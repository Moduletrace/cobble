import { describe, expect, test } from "bun:test";
import mentionedTaskIds from "./mentioned-task-ids";

/**
 * The ids a reply names in plain prose: the review checks them against the
 * tracker, since only the `[task:ID]` form used to be checked and a deleted
 * task stayed "open" in an answer.
 */
describe("mentionedTaskIds", () => {
    test("reads task #N and Task #N", () => {
        expect(mentionedTaskIds({ text: "Task #16 is on your list." })).toEqual([16]);
        expect(mentionedTaskIds({ text: "I updated task #7." })).toEqual([7]);
    });

    test("reads several, and each one once", () => {
        expect(mentionedTaskIds({ text: "Task #3 and task #4 are done, task #3 again." })).toEqual([3, 4]);
    });

    test("says nothing about a task said to be gone", () => {
        expect(mentionedTaskIds({ text: "Task #16 was deleted, so nothing is open." })).toEqual([]);
        expect(mentionedTaskIds({ text: "Task #16 doesn't exist any more." })).toEqual([]);
        expect(mentionedTaskIds({ text: "I removed task #16." })).toEqual([]);
        expect(mentionedTaskIds({ text: "Task #16 is gone." })).toEqual([]);
    });

    test("says nothing about a mention it says there is no task for", () => {
        expect(mentionedTaskIds({ text: "There's no task #16 to delete." })).toEqual([]);
        expect(mentionedTaskIds({ text: "Task #16 isn't in the list." })).toEqual([]);
        expect(mentionedTaskIds({ text: "I can't find task #16 anywhere." })).toEqual([]);
        expect(mentionedTaskIds({ text: "No such task #16 exists." })).toEqual([]);
    });

    test("a deletion in another sentence doesn't excuse the mention", () => {
        expect(mentionedTaskIds({ text: "Task #16 is still open. I deleted the draft of task #17." })).toEqual([16, 17]);
    });

    test("a gone word that doesn't govern the mention still counts", () => {
        expect(mentionedTaskIds({ text: "I deleted the draft of task #16 and it is still open." })).toEqual([16]);
    });

    test("leaves the ref form to the ref check", () => {
        expect(mentionedTaskIds({ text: "See [task:16]." })).toEqual([]);
    });

    test("a bare number is not a task mention", () => {
        expect(mentionedTaskIds({ text: "Run #469 finished, item 16 too." })).toEqual([]);
    });
});
