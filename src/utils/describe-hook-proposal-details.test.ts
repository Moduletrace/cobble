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

    test("a new hook's runner is shown word for word, with its folder and computer", () => {
        const details = describeHookProposalDetails({
            action: "create",
            data: {
                title: "WhatsApp",
                instructions: "Answer each message.",
                source: "url",
                runner_command: "python3 bridge.py",
                runner_dir: "whatsapp",
                runner_computer_id: 1,
            },
            computers: new Map([[1, "Main"]]),
        });

        expect(details.map((d) => d.label)).toEqual([
            "Name",
            "Called by",
            "Runs in",
            "Runs on",
            "Keeps running",
            "Starts in",
            "Runs it on",
            "Brief",
        ]);
        expect(details.find((d) => d.label == "Keeps running")).toEqual({
            label: "Keeps running",
            value: "python3 bridge.py",
            block: true,
        });
        expect(details.find((d) => d.label == "Starts in")?.value).toBe("The bot's whatsapp folder");
        expect(details.find((d) => d.label == "Runs it on")?.value).toContain("Main (#1)");
    });

    test("a runner added to an existing hook shows what it has now and what it would run", () => {
        const details = describeHookProposalDetails({
            action: "change",
            data: { runner_command: "python3 bridge.py", runner_dir: "whatsapp", runner_computer_id: 1 },
            current: { id: 7, title: "WhatsApp", instructions: "Answer.", enabled: 1 },
            computers: new Map([[1, "Main"]]),
        });

        expect(details.map((d) => d.label)).toEqual(["Hook", "Runner now", "New runner"]);
        expect(details[1]?.value).toBe("None");
        expect(details[2]?.value).toBe("python3 bridge.py in whatsapp, on Main (#1)");
    });
});
