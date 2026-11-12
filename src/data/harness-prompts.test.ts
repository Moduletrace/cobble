import { describe, expect, test } from "bun:test";
import {
    botFilesNote,
    chatReplyNote,
    ComputerFilesNote,
    coordinatorReplyNote,
    crewRequestsNote,
    openRunsNote,
    RequestScopeNote,
    TaskIncomingNote,
    TaskRedraftNote,
    TaskWrapUpIncomingNote,
    TasksNote,
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
        expect(note).toContain("don't offer it again in this conversation");
        expect(note).not.toContain("the brief is what you may do");
        expect(note).not.toContain("\u2014");
    });

    test("proposes instead of asking when nobody is watching", () => {
        const note = RequestScopeNote({ can_ask: false });

        expect(note).toContain("the brief is what you may do");
        expect(note).toContain("Say in your report what you would propose");
        expect(note).not.toContain("ask_user");
        expect(note).not.toContain("\u2014");
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
                { id: 5, title: "Cite sheet", status: "open" },
                { id: 4, title: "Research files", status: "answered" },
            ],
        });

        expect(note).toContain(`[room:5] "Cite sheet": still open`);
        expect(note).toContain(`[room:4] "Research files": answered`);
        expect(note).toContain("crew/room-4/");
        expect(note).toContain("Don't ask for these again");
    });

    test("is empty with no requests", () => {
        expect(crewRequestsNote({ requests: [] })).toBe("");
    });
});
