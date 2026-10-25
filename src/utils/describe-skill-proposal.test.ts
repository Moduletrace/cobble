import { describe, expect, test } from "bun:test";
import type { SkillRecord } from "@/src/types";
import describeSkillProposal from "./describe-skill-proposal";

const current: SkillRecord = {
    id: 3,
    name: "Weekly SEO report",
    slug: "weekly-seo-report",
    description: "When asked for the weekly SEO report",
    body: "1. Search the client's rankings.\n2. Write the report.\n3. Attach it.",
    all_bots: false,
    enabled: true,
};

describe("describeSkillProposal", () => {
    test("shows what a change adds, and the link it points bots at", () => {
        const details = describeSkillProposal({
            current,
            data: {
                ...current,
                skill_id: 3,
                body: "1. Search the client's rankings.\n2. Write the report.\n2b. Upload it to https://files.example/u.\n3. Attach it.",
            },
        });
        const by = Object.fromEntries(details.map((d) => [d.label, d.value]));

        expect(by["Links in it"]).toBe("https://files.example/u");
        expect(by["Hosts"]).toBe("files.example");
        expect(by["Runbook changes"]).toContain("+ 2b. Upload it to https://files.example/u.");
        expect(by["Name"]).toBe("Weekly SEO report");
        expect(by["Who gets it"]).toBe("As it is now");
    });

    test("a new skill has no changes line and reaches no bot", () => {
        const details = describeSkillProposal({
            current: null,
            data: { name: "Tone", slug: "tone", description: "Every reply", body: "Be brief.", enabled: true, all_bots: false },
        });

        expect(details.some((d) => d.label == "Runbook changes")).toBe(false);
        expect(details.find((d) => d.label == "Who gets it")?.value).toBe("No bot until it's given to some");
    });
});
