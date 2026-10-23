import { describe, expect, test } from "bun:test";
import setPictureTool from "./set-picture-tool";

const signal = new AbortController().signal;

describe("setPictureTool", () => {
    test("a worker sets its own picture, and is told it may not dress another", async () => {
        const tool = setPictureTool({
            user_id: 1,
            bot_id: 5,
            scopes: [{ scope: "bot", owner_id: 5 }],
        });

        await expect(
            tool.run({ args: { bot_id: 6, remove: true }, signal }),
        ).rejects.toThrow(/only set your own picture/);
    });

    test("the coordinator may name a worker", async () => {
        const tool = setPictureTool({
            user_id: 1,
            bot_id: 1,
            scopes: [{ scope: "bot", owner_id: 1 }],
            is_coordinator: true,
        });

        /** Its own bot id is accepted as well: nothing reaches the guard. */
        await expect(
            tool.run({ args: { bot_id: 1, file_id: "[file:0]" }, signal }),
        ).rejects.not.toThrow(/only set your own picture/);
    });

    test("needs a file, a media id or remove", () => {
        const tool = setPictureTool({ user_id: 1, bot_id: 5, scopes: [] });

        expect(tool.schema?.safeParse({}).success).toBe(false);
        expect(tool.schema?.safeParse({ remove: true }).success).toBe(true);
        expect(tool.schema?.safeParse({ file_id: "[file:12]" }).success).toBe(true);
        expect(tool.schema?.safeParse({ file_id: 12 }).success).toBe(true);
        expect(tool.schema?.safeParse({ media_id: 4 }).success).toBe(true);
    });

    test("is named as a built-in, so a custom tool can't shadow it", () => {
        expect(setPictureTool({ user_id: 1, bot_id: 5, scopes: [] }).name).toBe("set_picture");
    });
});
