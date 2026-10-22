import { describe, expect, test } from "bun:test";
import checkSkillSlug from "./check-skill-slug";

describe("checkSkillSlug", () => {
    test("accepts lowercase words joined by single hyphens", () => {
        expect(checkSkillSlug({ slug: "seo" })).toBeNull();
        expect(checkSkillSlug({ slug: "weekly-seo-report" })).toBeNull();
        expect(checkSkillSlug({ slug: "report2024" })).toBeNull();
    });

    test("refuses capitals, spaces, underscores and dots", () => {
        expect(checkSkillSlug({ slug: "Weekly" })).not.toBeNull();
        expect(checkSkillSlug({ slug: "weekly seo" })).not.toBeNull();
        expect(checkSkillSlug({ slug: "weekly_seo" })).not.toBeNull();
        expect(checkSkillSlug({ slug: "weekly.seo" })).not.toBeNull();
    });

    test("refuses a hyphen at either end and doubled hyphens", () => {
        expect(checkSkillSlug({ slug: "-weekly" })).not.toBeNull();
        expect(checkSkillSlug({ slug: "weekly-" })).not.toBeNull();
        expect(checkSkillSlug({ slug: "weekly--seo" })).not.toBeNull();
    });

    test("refuses slugs shorter than 2 or longer than 64 characters", () => {
        expect(checkSkillSlug({ slug: "a" })).not.toBeNull();
        expect(checkSkillSlug({ slug: "a".repeat(65) })).not.toBeNull();
        expect(checkSkillSlug({ slug: "a".repeat(64) })).toBeNull();
    });
});
