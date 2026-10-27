import { describe, expect, test } from "bun:test";
import chatroomHref from "./chatroom-href";

describe("chatroomHref", () => {
    test("a workspace's room opens inside the workspace", () => {
        expect(chatroomHref({ chatroom: { id: 5, workspace_id: 2 } })).toBe("/admin/workspaces/2/chatrooms/5");
    });

    test("a room from a bot's own chat opens on its own", () => {
        expect(chatroomHref({ chatroom: { id: 5, workspace_id: null as unknown as undefined } })).toBe("/admin/chatrooms/5");
    });
});
