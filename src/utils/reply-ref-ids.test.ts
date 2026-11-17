import { describe, expect, test } from "bun:test";
import replyRefIds from "./reply-ref-ids";

describe("replyRefIds", () => {
    test("reads each ref of the kind once, links and code spans included", () => {
        const text = "Notes in [file:294](99designs/notes.md), scan in `[file:301]`, again [file:294]; [task:20] and [ task:21 ].";

        expect(replyRefIds({ text, kind: "file" })).toEqual([294, 301]);
        expect(replyRefIds({ text, kind: "task" })).toEqual([20]);
    });

    test("finds nothing in plain text", () => {
        expect(replyRefIds({ text: "file 301 and task #20", kind: "file" })).toEqual([]);
    });

    test("reads the card refs the app adds and the graphic refs the model writes", () => {
        const text = "Next steps: [suggestion:11]. Questions in [question:4], the plan in [plan:7], the chart in [graphic:2] and [graphic:2] again.";

        expect(replyRefIds({ text, kind: "suggestion" })).toEqual([11]);
        expect(replyRefIds({ text, kind: "question" })).toEqual([4]);
        expect(replyRefIds({ text, kind: "plan" })).toEqual([7]);
        expect(replyRefIds({ text, kind: "graphic" })).toEqual([2]);
    });
});
