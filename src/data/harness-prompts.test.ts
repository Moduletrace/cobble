import { describe, expect, test } from "bun:test";
import {
    botFilesNote,
    chatReplyNote,
    ComputerFilesNote,
    contextTrimmedNote,
    coordinatorReplyNote,
    AskGateNote,
    AskGateRequest,
    crewRequestsNote,
    openRunsNote,
    QuestionsNote,
    RequestScopeNote,
    TaskIncomingNote,
    TaskPlanPrompt,
    TaskRedraftNote,
    TaskRunNote,
    TaskWrapUpIncomingNote,
    TasksNote,
    wrapUpWorktreeNote,
    PlansNote,
    PlanStepNote,
    PlanWaitingNote,
    PlanActiveNote,
    PlanPausedNote,
    ScheduledPlanNote,
} from "./harness-prompts";
import computerRunDirs from "@/src/utils/computer-work-dirs";

/**
 * Every note a bot reads names it by its own id, so a bot copying an
 * example never points at another bot's folder, conversation or task.
 */
const bot_ids = [1, 5, 42] as const;

/**
 * The bot ids a note's own-folder examples point at, in order.
 */
function folderOwners(note: string) {
    return [...note.matchAll(/\[folder:bot:(\d+):/g)].map((match) => match[1]);
}

describe("harness prompts", () => {
    for (const bot_id of bot_ids) {
        test(`chat reply note names bot ${bot_id}'s own folder`, () => {
            const owners = folderOwners(chatReplyNote({ bot_id }));

            expect(owners).toEqual([String(bot_id)]);
        });

        test(`files note names bot ${bot_id}'s own folder`, () => {
            const owners = folderOwners(botFilesNote({ bot_id }));

            expect(owners).toEqual([String(bot_id)]);
        });

        test(`coordinator note names itself as bot ${bot_id}`, () => {
            const note = coordinatorReplyNote({ bot_id });

            expect(note).toContain(`[bot:${bot_id}]`);
            expect(note).not.toContain("[bot:3]");
        });
    }

    test("a note that already names the running bot is unchanged by its id", () => {
        expect(botFilesNote({ bot_id: 5 })).toContain("[folder:bot:5:reports]");
    });

    test("the computer files note names the computer and the run's folders", () => {
        const note = ComputerFilesNote({
            computer_id: 8,
            dirs: computerRunDirs({ bot_id: 3, user_id: 7, workspace_id: 2 }),
        });

        expect(note).toContain("[folder:computer:8:home/cb-3/workspace/users/7/seo/coderank/raw]");
        expect(note).toContain("starts in /home/cb-3/workspace/users/7 (also ~ and $HOME)");
        expect(note).toContain("/home/cb-3/workspace/workspaces/2: shared");
        expect(note).toContain("only /home/cb-3/workspace and the browser's logins survive it (the rest of your account's home, /home/cb-3, doesn't)");
        expect(note).toContain("request_install");
        expect(note).not.toContain("sudo apt-get");
    });

    test("the coordinator's computer files note keeps sudo", () => {
        const note = ComputerFilesNote({
            computer_id: 8,
            dirs: computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 7 }),
        });

        expect(note).toContain("sudo apt-get");
        expect(note).toContain("/home/gem/workspace/bots/1/users/7");
        expect(note).toContain("only /home/gem/workspace and the browser's logins survive it. ");
        expect(note).not.toContain("request_install");
    });

    test("notes with nothing bot-specific carry no ref example", () => {
        expect(TasksNote).not.toContain("[folder:bot:");
        expect(TasksNote).not.toContain("[bot:");
    });
});

describe("openRunsNote", () => {
    test("names each open run and whether it's queued or under way", () => {
        const note = openRunsNote({
            runs: [
                { id: 12, title: "Art directions", status: "processing" },
                { id: 13, title: null, status: "pending" },
            ],
        });

        expect(note).toContain(`Run #12 "Art directions": under way`);
        expect(note).toContain(`Run #13 "Task": queued`);
        expect(note).toContain("don't start another run");
        expect(note).not.toContain("\u2014");
    });

    test("is empty with no open runs", () => {
        expect(openRunsNote({ runs: [] })).toBe("");
    });
});

describe("RequestScopeNote", () => {
    test("sends crew changes and handed-out work through one ask_user card", () => {
        const note = RequestScopeNote({ can_ask: true });

        expect(note).toContain("not permission to put them in a workspace, assign them computers or give them work");
        expect(note).toContain("a standing preference is not a standing instruction");
        expect(note).toContain("the same ask_user card");
        expect(note).toContain("delegating a task");
        expect(note).toContain("ask before it leaves: one ask_user card with every task they named");
        expect(note).toContain("don't offer it again in this conversation");
        expect(note).toContain("The way they named is part of the request");
        expect(note).toContain("ask before you start a different way");
        expect(note).toContain("Never deliver the same result by a way they didn't ask for");
        expect(note).toContain("A probe is work too");
        expect(note).toContain("a test of what the tools can reach is not the deliverable");
        expect(note).not.toContain("the brief is what you may do");
        expect(note).not.toContain("\u2014");
    });

    test("proposes instead of asking when nobody is watching", () => {
        const note = RequestScopeNote({ can_ask: false });

        expect(note).toContain("the brief is what you may do");
        expect(note).toContain("Say in your report what you would propose");
        expect(note).toContain("move it as to do and say in your report that it waits for the user to start it");
        expect(note).toContain("say in your report what was blocked and what you would propose");
        expect(note).not.toContain("ask before you start a different way");
        expect(note).not.toContain("ask_user");
        expect(note).not.toContain("\u2014");
    });
});

describe("QuestionsNote", () => {
    test("asks before working around the way the user named", () => {
        expect(QuestionsNote).toContain("before changing the approach the user named");
        expect(QuestionsNote).toContain("Ask before the substitute starts, never after");
        expect(QuestionsNote).not.toContain("\u2014");
    });
});

describe("task incoming notes", () => {
    test("leave separate requests to the chat and never offer send_message", () => {
        for (const note of [TaskIncomingNote, TaskRedraftNote, TaskWrapUpIncomingNote]) {
            expect(note).not.toContain("send_message");
            expect(note).not.toContain("\u2014");
        }

        expect(TaskIncomingNote).toContain("leave it to the chat");
        expect(TaskRedraftNote).toContain("leave it to the chat");
    });
});

describe("crewRequestsNote", () => {
    test("lists open and answered requests, and where an answer's files are", () => {
        const note = crewRequestsNote({
            requests: [
                { id: 5, title: "Cite sheet", status: "pending" },
                { id: 4, title: "Research files", status: "answered" },
            ],
        });

        expect(note).toContain(`ask #5 "Cite sheet": waiting on the coordinator`);
        expect(note).toContain(`ask #4 "Research files": answered`);
        expect(note).toContain("crew/ask-4/");
        expect(note).toContain("Don't ask for these again");
    });

    test("is empty with no requests", () => {
        expect(crewRequestsNote({ requests: [] })).toBe("");
    });
});

describe("contextTrimmedNote", () => {
    test("says how often output was cut, and what to do instead of re-reading", () => {
        const note = contextTrimmedNote({ trimmed: 6 });

        expect(note).toContain("6 times now");
        expect(note).toContain("put what you establish in a file of your own");
    });
});

describe("wrapUpWorktreeNote", () => {
    test("hands the run the tree's own answer, fenced, and forbids memory", () => {
        const summary = "== /home/gem/w/repo\n M src/server.ts\n src/server.ts | 4 +-";
        const note = wrapUpWorktreeNote({ summary });

        expect(note).toContain("```\n" + summary + "\n```");
        expect(note).toContain("M src/server.ts");
        expect(note).toContain("never describe a file from memory");
    });
});

describe("TaskRunNote", () => {
    test("says a brief can be wrong about the tree, and that handing on finishes the task", () => {
        expect(TaskRunNote).toContain("A brief can be wrong about the repository");
        expect(TaskRunNote).toContain("the tree wins");
        expect(TaskRunNote).toContain("start_task with separate for the rest");
    });

    test("gives the plan permission to hand work on", () => {
        expect(TaskPlanPrompt).toContain("hands the rest on with start_task is following the plan");
    });

    test("says the user's own words win over the brief, and the way they named is the way it is done", () => {
        expect(TaskRunNote).toContain("the run opens with their own words");
        expect(TaskRunNote).toContain("the brief after it is your summary of it");
        expect(TaskRunNote).toContain("the way they named (a tool, app, service or path) is the way it is done");
        expect(TaskRunNote).toContain("never reach the same result some other way without asking first");
        expect(TaskRunNote).not.toContain("\u2014");
    });
});

describe("AskGateNote", () => {
    const askable = ["4: Tben INC Admin", "6: SEO Expert"];

    test("names the bot the asker suggested as a suggestion", () => {
        const note = AskGateNote({ requester: "Model Tester (14)", askable, in_workspace: false, suggested: "[bot:4] Tben INC Admin" });

        expect(note).toContain("It asked to send this to [bot:4] Tben INC Admin: that is its suggestion");
    });

    test("asks for a bot when the asker named none", () => {
        const note = AskGateNote({ requester: "Model Tester (14)", askable, in_workspace: false, suggested: null });

        expect(note).toContain("It named no bot: pick the one that should answer it.");
    });

    test("never tells the asker to ask the coordinator, which it cannot", () => {
        const note = AskGateNote({ requester: "Model Tester (14)", askable, in_workspace: false });

        expect(note).toContain("This request is the only way the asking bot reaches another bot");
        expect(note).not.toContain("ask the coordinator directly");
    });

    test("says there is no bot to ask when there is none", () => {
        const note = AskGateNote({ requester: "Model Tester (14)", askable: [], in_workspace: false });

        expect(note).toContain("With none, refuse it and say so.");
    });
});

describe("AskGateRequest", () => {
    test("carries the suggested bot and the brief", () => {
        const text = AskGateRequest({
            requester_id: 14,
            requester_name: "Model Tester",
            in_workspace: false,
            title: "Open tasks",
            request: "List your open tasks.",
            suggested: "[bot:4] Tben INC Admin",
        });

        expect(text).toContain("It asked to send this to: [bot:4] Tben INC Admin");
        expect(text).toContain("Title: Open tasks");
        expect(text).toContain("List your open tasks.");
    });
});

/**
 * A plan is the answer to a bot that answers a long request with one wall of
 * text: the notes hold it to one step per reply and a report of two or three
 * sentences, and the card behind them shows the rest.
 */
const plan = {
    id: 4,
    title: "Audit the pricing pages",
    goal: "Know which pages price badly",
    status: "active" as const,
    steps: [
        { text: "Collect the pages", state: "done" as const, note: "14 pages" },
        { text: "Score them", state: "pending" as const, note: "" },
        { text: "Write it up", state: "pending" as const, note: "" },
    ],
    current_step: 1,
};

describe("plan notes", () => {
    test("waits for the user's approval, and says a plan that is open stays open", () => {
        expect(PlanWaitingNote({ plan: { ...plan, status: "planned", current_step: 1 } })).toContain(
            "Plan #4 \"Audit the pricing pages\"",
        );
        expect(PlansNote).toContain("nothing of it starts until the user approves it");
    });

    test("tells the run to work its step only, then report in two or three sentences", () => {
        const note = PlanStepNote({ plan });

        expect(note).toContain("This reply works step 2 only: Score them");
        expect(note).toContain("One step per reply");
        expect(note).toContain("two or three sentences");
        expect(note).toContain("complete_plan_step");
    });

    test("lists the steps with where each one stands and what it produced", () => {
        const note = PlanStepNote({ plan });

        expect(note).toContain("1. [done] Collect the pages - 14 pages");
        expect(note).toContain("2. [now] Score them");
        expect(note).toContain("3. [pending] Write it up");
    });

    test("an active plan elsewhere in the conversation leaves the plan where it is", () => {
        expect(PlanActiveNote({ plan })).toContain("leave the plan where it is");
    });

    test("a paused plan is the user's to resume", () => {
        expect(PlanPausedNote({ plan: { ...plan, status: "paused" } })).toContain("paused by the user");
    });

    test("a routine's plan is approved at once and worked through in the run", () => {
        expect(ScheduledPlanNote).toContain("approved at once");
        expect(ScheduledPlanNote).toContain("work its steps in this run");
    });
});
