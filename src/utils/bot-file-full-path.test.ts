import { describe, expect, test } from "bun:test";
import botFileFullPath from "./bot-file-full-path";

describe("botFileFullPath", () => {
    test("a bot's file sits under bots/<id>", () => {
        expect(botFileFullPath({ scope: "bot", owner_id: 3, path: "reports/q3.md" })).toBe("bots/3/reports/q3.md");
    });

    test("a workspace's file sits under workspaces/<id>", () => {
        expect(botFileFullPath({ scope: "workspace", owner_id: "7", path: "/brief.md" })).toBe(
            "workspaces/7/brief.md",
        );
    });
});
