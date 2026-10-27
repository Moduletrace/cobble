import { describe, expect, test } from "bun:test";
import chatroomRef, { chatroomRefId } from "./chatroom-ref";
import linkComputerRefs from "./link-computer-refs";

describe("chatroomRef", () => {
    test("names a chatroom", () => {
        expect(chatroomRef({ id: 5 })).toBe("[room:5]");
    });

    test("reads the id back from its link", () => {
        expect(chatroomRefId({ href: "#room-5" })).toBe(5);
        expect(chatroomRefId({ href: "#room-0" })).toBeNull();
        expect(chatroomRefId({ href: "#room-x" })).toBeNull();
        expect(chatroomRefId({ href: "#bot-5" })).toBeNull();
        expect(chatroomRefId({ href: null })).toBeNull();
    });

    test("becomes a link in a message", () => {
        expect(linkComputerRefs({ text: "Asked in [room:5]." })).toBe("Asked in [room 5](#room-5).");
    });
});
