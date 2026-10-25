import { describe, expect, test } from "bun:test";
import {
    botFilesNote,
    chatReplyNote,
    ComputerFilesNote,
    coordinatorReplyNote,
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

        expect(note).toContain("[folder:computer:8:bots/3/users/7/seo/coderank/raw]");
        expect(note).toContain("/home/gem/workspace/bots/3/users/7");
        expect(note).toContain("/home/gem/workspace/workspaces/2");
    });

    test("notes with nothing bot-specific carry no ref example", () => {
        expect(TasksNote).not.toContain("[folder:bot:");
        expect(TasksNote).not.toContain("[bot:");
    });
});
