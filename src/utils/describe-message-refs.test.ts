import { describe, expect, test } from "bun:test";
import describeMessageRefs, { type MessageRefNames } from "./describe-message-refs";
import messageRefIds from "./message-ref-ids";

const names: MessageRefNames = {
    bots: new Map([[3, { name: "Ada", role: "Researcher" }], [4, { name: "Bo" }]]),
    workspaces: new Map([[2, { name: "Launch" }]]),
};

describe("messageRefIds", () => {
    test("collects each bot and workspace once, links aside", () => {
        expect(
            messageRefIds({ texts: ["[bot:3] and [bot:3]", "[workspace:2] [bot:9](https://x.y)"] }),
        ).toEqual({ bot_ids: [3], workspace_ids: [2] });
    });
});

describe("describeMessageRefs", () => {
    test("names what a message mentions", () => {
        expect(describeMessageRefs({ text: "Ask [bot:3] and [bot:4] in [workspace:2]", names })).toBe(
            '[Mentions: [bot:3] is Ada (Researcher); [bot:4] is Bo; [workspace:2] is the workspace "Launch"]',
        );
    });

    test("leaves out refs the user can't reach", () => {
        expect(describeMessageRefs({ text: "[bot:8] and [workspace:7]", names })).toBe("");
        expect(describeMessageRefs({ text: "no refs", names })).toBe("");
    });
});
