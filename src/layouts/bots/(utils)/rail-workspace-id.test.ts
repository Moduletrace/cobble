import { describe, expect, test } from "bun:test";
import railWorkspaceId from "./rail-workspace-id";

describe("railWorkspaceId", () => {
    test("lists a workspace's crew on its own pages", () => {
        expect(
            railWorkspaceId({
                workspace: { id: 4 },
                pathname: "/admin/workspaces/4/chatrooms",
            }),
        ).toBe(4);
    });

    test("lists the bots' own chats elsewhere, even with a workspace at hand", () => {
        expect(
            railWorkspaceId({
                workspace: { id: 4 },
                pathname: "/admin/settings/general",
            }),
        ).toBeNull();
        expect(
            railWorkspaceId({ workspace: { id: 4 }, pathname: "/admin/bots/2" }),
        ).toBeNull();
    });

    test("a workspace page with no workspace listed has no scope", () => {
        expect(
            railWorkspaceId({ workspace: null, pathname: "/admin/workspaces/4" }),
        ).toBeNull();
        expect(railWorkspaceId({ workspace: { id: null }, pathname: null })).toBeNull();
    });
});