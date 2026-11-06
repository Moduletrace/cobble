import { describe, expect, test } from "bun:test";
import replyClaimProblems from "./reply-claim-problems";

const underWay = "I'm scanning the open contests now. When it's back, I'll create the tasks.";

describe("replyClaimProblems", () => {
    test("faults work said to be under way when nothing was started or is open", () => {
        const problems = replyClaimProblems({ text: underWay, tool_uses: [] });

        expect(problems.length).toBe(1);
        expect(problems[0]).toContain("start_task");
    });

    test("passes it once a run was started, handed over or a room asked, or one is open", () => {
        for (const name of ["start_task", "delegate_task", "ask_crew"]) {
            expect(replyClaimProblems({ text: underWay, tool_uses: [{ name, ok: true }] })).toEqual([]);
        }

        expect(replyClaimProblems({ text: underWay, tool_uses: [], has_open_work: true })).toEqual([]);
    });

    test("a start_task call that failed doesn't count", () => {
        expect(replyClaimProblems({ text: underWay, tool_uses: [{ name: "start_task", ok: false }] }).length).toBe(1);
    });

    test("names files and tasks that don't exist", () => {
        const problems = replyClaimProblems({
            text: "Saved in [file:301]; see [task:20].",
            tool_uses: [{ name: "list_tasks", ok: true }],
            missing_file_ids: [301],
            missing_task_ids: [20],
        });

        expect(problems.length).toBe(2);
        expect(problems[0]).toContain("[file:301]");
        expect(problems[1]).toContain("[task:20]");
    });

    test("an answer that holds up has no problems", () => {
        expect(replyClaimProblems({ text: "Task #20 is cancelled.", tool_uses: [] })).toEqual([]);
    });
});
