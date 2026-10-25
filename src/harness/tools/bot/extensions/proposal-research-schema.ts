import { z } from "zod";
import { AppData } from "@/src/data/app-data";

/**
 * The background check every proposal carries: the bot's findings and the
 * pages it read, shown on the card as the bot's own words.
 */
export const ProposalResearchFields = {
    research: z
        .string()
        .trim()
        .min(AppData.ExtensionResearchMinChars, "Write down what your background check found")
        .max(AppData.ExtensionResearchMaxChars)
        .describe(
            "What your background check found: who publishes it, whether this URL is their official one, what it needs (keys, accounts, plans), and anything that worried you",
        ),
    sources: z
        .array(z.url({ protocol: /^https?$/ }))
        .min(1, "Give the pages your background check read")
        .max(AppData.ExtensionResearchSourcesMax)
        .describe("The pages you read for the check, full URLs, the publisher's own docs first"),
};

/**
 * A skill's review: the bot's own read of what the runbook makes bots do,
 * and where its content came from. Sources are optional, since a bot
 * often writes a runbook itself.
 */
export const SkillReviewFields = {
    research: z
        .string()
        .trim()
        .min(AppData.ExtensionResearchMinChars, "Write down your review of the runbook")
        .max(AppData.ExtensionResearchMaxChars)
        .describe(
            "Your review of the runbook: what it makes bots do step by step, any step that sends data, files or keys anywhere or reads secrets, and where its content came from (written by you, the user's words, or copied from a page)",
        ),
    sources: z
        .array(z.url({ protocol: /^https?$/ }))
        .max(AppData.ExtensionResearchSourcesMax)
        .default([])
        .describe("Pages any of it was copied or adapted from, full URLs"),
};
