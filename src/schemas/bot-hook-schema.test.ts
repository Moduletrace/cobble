import { describe, expect, test } from "bun:test";
import { HookProposalDataSchema } from "./bot-hook-schema";

describe("HookProposalDataSchema", () => {
    test("a bot's runner proposal carries the command, folder and computer", () => {
        expect(
            HookProposalDataSchema.parse({
                runner_command: " python3 bridge.py ",
                runner_dir: "whatsapp",
                runner_computer_id: 1,
            }),
        ).toEqual({ runner_command: "python3 bridge.py", runner_dir: "whatsapp", runner_computer_id: 1 });
    });

    test("the folder has to stay inside the bot's folder", () => {
        expect(() => HookProposalDataSchema.parse({ runner_command: "x", runner_dir: "/etc" })).toThrow(
            "Give the folder inside the bot's folder",
        );
        expect(() => HookProposalDataSchema.parse({ runner_command: "x", runner_dir: "~/secrets" })).toThrow(
            "The runner's folder has to be inside the bot's folder",
        );
        expect(() => HookProposalDataSchema.parse({ runner_command: "x", runner_dir: "a/../.." })).toThrow(
            "The runner's folder has to stay inside the bot's folder",
        );
    });

    test("a proposal without a runner is still whatever a bot may change", () => {
        expect(HookProposalDataSchema.parse({ enabled: true })).toEqual({ enabled: true });
    });
});