import { describe, expect, test } from "bun:test";
import {
    botFilesNote,
    chatReplyNote,
    ComputerFilesNote,
    coordinatorReplyNote,
    TasksNote,
} from "./harness-prompts";

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

    test("the computer files note keeps naming the computer it was given", () => {
        expect(ComputerFilesNote({ computer_id: 8 })).toContain("[folder:computer:8:seo/coderank/raw]");
    });

    test("notes with nothing bot-specific carry no ref example", () => {
        expect(TasksNote).not.toContain("[folder:bot:");
        expect(TasksNote).not.toContain("[bot:");
    });
});
