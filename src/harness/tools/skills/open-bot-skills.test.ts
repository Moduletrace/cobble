import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import type { SkillRecord } from "@/src/types";
import openBotSkills from "./open-bot-skills";

function skill(overrides: Partial<SkillRecord> & { slug: string }): SkillRecord {
    return {
        id: 1,
        name: overrides.slug,
        description: `When ${overrides.slug} applies.`,
        body: `${overrides.slug} body`,
        all_bots: false,
        enabled: true,
        ...overrides,
    };
}

describe("openBotSkills", () => {
    test("no skills means no tool and no note", () => {
        expect(openBotSkills({ skills: [] })).toEqual({ tools: [], note: "" });
    });

    test("a disabled skill is left out entirely", () => {
        const opened = openBotSkills({ skills: [skill({ slug: "seo", enabled: false })] });

        expect(opened.tools).toHaveLength(0);
        expect(opened.note).toBe("");
    });

    test("one tool, named load_skill, whose description lists the slugs", () => {
        const opened = openBotSkills({ skills: [skill({ slug: "seo" }), skill({ slug: "inbox", id: 2 })] });

        expect(opened.tools).toHaveLength(1);
        expect(opened.tools[0]!.name).toBe("load_skill");
        expect(opened.tools[0]!.description).toContain("- seo:");
        expect(opened.tools[0]!.description).toContain("- inbox:");
        expect(opened.note).toContain("# Skills");
    });

    test("a built-in that took the name wins", () => {
        expect(openBotSkills({ skills: [skill({ slug: "seo" })], taken: ["load_skill"] })).toEqual({
            tools: [],
            note: "",
        });
    });

    test("the tool returns the body of the slug it's given", async () => {
        const opened = openBotSkills({ skills: [skill({ slug: "seo", body: "1. Pull rankings" })] });
        const output = await opened.tools[0]!.run!({ args: { slug: "seo" }, signal: AbortSignal.timeout(1000) });

        expect(output).toBe("1. Pull rankings");
    });

    test("an unknown slug fails with the slugs it does have", async () => {
        const opened = openBotSkills({ skills: [skill({ slug: "seo" })] });

        await expect(opened.tools[0]!.run!({ args: { slug: "nope" }, signal: AbortSignal.timeout(1000) })).rejects.toThrow(
            /no skill called "nope".*seo/,
        );
    });

    test("a long body is cut at the limit and says so", async () => {
        const opened = openBotSkills({
            skills: [skill({ slug: "seo", body: "x".repeat(AppData.SkillBodyShownChars + 500) })],
        });
        const output = await opened.tools[0]!.run!({ args: { slug: "seo" }, signal: AbortSignal.timeout(1000) });

        expect(output).toContain("Cut at");
        expect(output.length).toBeLessThan(AppData.SkillBodyShownChars + 200);
    });

    test("an empty body says it is empty rather than returning nothing", async () => {
        const opened = openBotSkills({ skills: [skill({ slug: "seo", body: "" })] });
        const output = await opened.tools[0]!.run!({ args: { slug: "seo" }, signal: AbortSignal.timeout(1000) });

        expect(output).toContain("is empty");
    });
});
