import { describe, expect, test } from "bun:test";
import taskPlaceLabel from "./task-place-label";

describe("taskPlaceLabel", () => {
    test("names the bot for its own list", () => {
        expect(taskPlaceLabel({ task: { bot_id: 2, bot_name: "Ada" } })).toBe("Ada");
    });

    test("names the bot and the workspace for a bot's task there", () => {
        expect(taskPlaceLabel({ task: { bot_id: 2, bot_name: "Ada", workspace_id: 5, workspace_name: "Launch" } })).toBe(
            "Ada in Launch",
        );
    });

    test("says every bot for a workspace-wide task", () => {
        expect(taskPlaceLabel({ task: { workspace_id: 5, workspace_name: "Launch" } })).toBe("Every bot in Launch");
    });
});
