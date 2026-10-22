import { SkillSlugPattern } from "@/src/dict/skill-dict";

type Params = {
    slug: string;
};

/**
 * Why a skill can't take this slug, or null when it can: lowercase letters,
 * numbers and single hyphens, 2 to 64 characters, never starting or ending
 * with one. It's what a bot writes in `load_skill`.
 */
export default function checkSkillSlug({ slug }: Params): string | null {
    if (slug.length < 2 || slug.length > 64) {
        return `Use 2 to 64 characters.`;
    }

    if (!SkillSlugPattern.test(slug)) {
        return `Use lowercase letters, numbers and hyphens, e.g. weekly-seo-report.`;
    }

    return null;
}
