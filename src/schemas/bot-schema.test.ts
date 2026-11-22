import { describe, expect, test } from "bun:test";
import { MessageDetailsRequestSchema, UpdateBotMemoryRequestSchema } from "./bot-schema";

describe("MessageDetailsRequestSchema", () => {
    test("asks for the modal's calls by default", () => {
        const parsed = MessageDetailsRequestSchema.parse({ message_id: "7" });

        expect(parsed).toEqual({ message_id: 7, full: false });
    });

    test("reads the report's flag from a query string", () => {
        expect(MessageDetailsRequestSchema.parse({ message_id: "7", full: "1" }).full).toBe(true);
        expect(MessageDetailsRequestSchema.parse({ message_id: "7", full: "true" }).full).toBe(true);
        expect(MessageDetailsRequestSchema.parse({ message_id: "7", full: "0" }).full).toBe(false);
        expect(MessageDetailsRequestSchema.parse({ message_id: "7", full: false }).full).toBe(false);
    });

    test("refuses a message it can't read", () => {
        expect(MessageDetailsRequestSchema.safeParse({ message_id: "0" }).success).toBe(false);
        expect(MessageDetailsRequestSchema.safeParse({ message_id: "abc" }).success).toBe(false);
        expect(MessageDetailsRequestSchema.safeParse({}).success).toBe(false);
    });
});

describe("UpdateBotMemoryRequestSchema", () => {
    test("takes the whole new memory", () => {
        expect(UpdateBotMemoryRequestSchema.parse({ bot_id: "3", memory: "It writes short." })).toEqual({
            bot_id: 3,
            memory: "It writes short.",
        });
    });

    test("allows clearing it", () => {
        expect(UpdateBotMemoryRequestSchema.parse({ bot_id: 3, memory: "" }).memory).toBe("");
    });

    test("refuses a bot or a memory that isn't there", () => {
        expect(UpdateBotMemoryRequestSchema.safeParse({ bot_id: 3 }).success).toBe(false);
        expect(UpdateBotMemoryRequestSchema.safeParse({ bot_id: 0, memory: "x" }).success).toBe(false);
    });
});
