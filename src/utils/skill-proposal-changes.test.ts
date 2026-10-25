import { describe, expect, test } from "bun:test";
import type { SkillRecord } from "@/src/types";
import skillProposalChanges from "./skill-proposal-changes";

const current: SkillRecord = {
    id: 2,
    name: "WhatsApp Web API",
    slug: "whatsapp-web-api",
    description: "Old description",
    body: "1. Install Baileys.\n2. Pair.",
    all_bots: false,
    enabled: true,
};

describe("skillProposalChanges", () => {
    test("a change that kept the old runbook doesn't name the runbook", () => {
        const changes = skillProposalChanges({ current, data: { ...current, skill_id: 2, description: "New description" } });

        expect(changes.fields).toEqual(["description"]);
        expect(changes.body_changed).toBe(false);
    });

    test("a new runbook is named, with both lengths", () => {
        const body = "1. Install Baileys, @hapi/boom and pino.\n2. Pair.\n3. Allowlist.";
        const changes = skillProposalChanges({ current, data: { ...current, skill_id: 2, body } });

        expect(changes.fields).toEqual(["runbook"]);
        expect(changes.body_chars).toBe(body.length);
        expect(changes.was_body_chars).toBe(current.body.length);
    });

    test("saving it as it is changes nothing", () => {
        expect(skillProposalChanges({ current, data: { ...current, skill_id: 2 } }).fields).toEqual([]);
    });

    test("turning it off and giving it to every bot are changes", () => {
        const changes = skillProposalChanges({ current, data: { ...current, enabled: false, all_bots: true } });

        expect(changes.fields).toEqual(["on/off", "every bot gets it"]);
    });

    test("a new skill is all new", () => {
        const changes = skillProposalChanges({
            current: null,
            data: { name: "Tone", slug: "tone", description: "Every reply", body: "Be brief.", enabled: true, all_bots: false },
        });

        expect(changes.fields).toEqual(["name", "slug", "description", "runbook"]);
        expect(changes.body_changed).toBe(true);
    });
});
