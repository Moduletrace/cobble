import { describe, expect, test } from "bun:test";
import describeHookProposalDetails from "./describe-hook-proposal-details";

describe("describeHookProposalDetails", () => {
    test("a new URL hook shows who calls it, where it runs and its whole brief", () => {
        const details = describeHookProposalDetails({
            action: "create",
            data: { title: "GitHub pushes", instructions: "Summarise each push.", source: "url", computer_id: 3 },
            workspace_name: "Launch",
            computers: new Map([[3, "Main"]]),
        });

        expect(details).toEqual([
            { label: "Name", value: "GitHub pushes" },
            { label: "Called by", value: "Anyone with its URL (shown to you once, when you confirm)" },
            { label: "Runs in", value: "The workspace Launch" },
            { label: "Runs on", value: "Main (#3)" },
            { label: "Brief", value: "Summarise each push.", block: true },
        ]);
    });

    test("a notification hook runs on the computer it watches unless told otherwise", () => {
        const details = describeHookProposalDetails({
            action: "create",
            data: { title: "Slack", instructions: "Answer.", source: "browser_notifications", watch_computer_id: 2 },
            computers: new Map([[2, "Desk"]]),
        });

        expect(details.find((d) => d.label == "Called by")?.value).toBe("Browser notifications on Desk (#2)");
        expect(details.find((d) => d.label == "Takes")?.value).toBe("Every notification");
        expect(details.find((d) => d.label == "Runs in")?.value).toBe("The bot's own chat with you");
        expect(details.find((d) => d.label == "Runs on")?.value).toBe("Desk (#2)");
    });

    test("a change shows each field as it is and as it would be, and nothing else", () => {
        const details = describeHookProposalDetails({
            action: "change",
            data: { instructions: "New brief.", enabled: true },
            current: { id: 7, title: "GitHub pushes", instructions: "Old brief.", enabled: 0 },
            computers: new Map(),
        });

        expect(details.map((d) => d.label)).toEqual(["Hook", "Brief now", "New brief", "Switch on"]);
        expect(details[1]?.value).toBe("Old brief.");
        expect(details[2]?.value).toBe("New brief.");
    });
});
