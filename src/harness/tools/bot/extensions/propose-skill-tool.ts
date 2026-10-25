import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import createExtensionProposal from "@/src/functions/backend/db/extension-proposals/create-extension-proposal";
import grabExtensionProposalView from "@/src/functions/backend/db/extension-proposals/grab-extension-proposal-view";
import assertSkillBodyFits from "@/src/functions/backend/db/extensions/assert-skill-body-fits";
import grabSkill from "@/src/functions/backend/db/extensions/grab-skill";
import { SaveSkillRequestSchema } from "@/src/schemas/extension-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import proposalRef from "@/src/utils/proposal-ref";
import skillProposalChanges from "@/src/utils/skill-proposal-changes";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import describeProposalForBot from "./describe-proposal-for-bot";
import { SkillReviewFields } from "./proposal-research-schema";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Called with the proposal's ref, so the reply always carries its card.
     */
    onPropose?: (params: { ref: string }) => void;
};

type Args = {
    skill_id?: number;
    name?: string;
    slug?: string;
    description?: string;
    body?: string;
    enabled?: boolean;
    all_bots?: boolean;
    research: string;
    sources: string[];
};

/**
 * Lets the coordinator propose a skill, or a change to one's name, slug,
 * description or runbook, for the user to confirm from a card in the
 * chat. A runbook steers every bot that loads it, so nothing is saved
 * until they do: the card shows the whole runbook, what changed, what it
 * points bots at (links, hosts, tool names, anything about secrets, read
 * by the app) and the bot's review.
 */
export default function proposeSkillTool({ user_id, bot_id, session_id, workspace_id, onPropose }: Params): HarnessTool<Args> {
    return {
        name: "propose_skill",
        description: `Propose adding a skill (a runbook bots load with load_skill when its one-line description says it applies), or changing one's name, slug, description or body (skill_id), for the user to confirm. Nothing is saved until they press Confirm on the card. Changing one keeps every field you leave out; body replaces the whole runbook, so read it first with list_extensions and keep what still applies: send the whole new runbook in body, and leave body out only to keep the saved one. A new one needs name, slug (lowercase words with hyphens, how bots load it), description and body. First review the runbook yourself and give it in research: what it makes bots do, any step that sends data, files or keys anywhere or reads secrets, and where the content came from (add the pages to sources if any of it came from one). Never put a key's value in a runbook. Check list_extensions first: if a skill already covers the job, propose a change to it instead.`,
        schema: z.object({
            skill_id: z.number().int().positive().optional(),
            name: z.string().trim().max(80).optional(),
            slug: z.string().trim().max(80).optional(),
            description: z.string().trim().max(AppData.SkillDescriptionMaxChars).optional(),
            body: z.string().max(AppData.SkillBodyLimitMax).optional().describe("The runbook, markdown"),
            enabled: z.boolean().optional(),
            all_bots: z.boolean().optional(),
            ...SkillReviewFields,
        })
            /**
             * A runbook sent under another name (`runbook`, `content`) would
             * otherwise be dropped, and the saved one proposed again.
             */
            .strict(),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const current = args.skill_id ? await grabSkill({ skill_id: args.skill_id }) : null;
            const data = parseWithSchema({
                schema: SaveSkillRequestSchema,
                data: {
                    skill_id: current?.id,
                    name: args.name ?? current?.name,
                    slug: args.slug ?? current?.slug,
                    description: args.description ?? current?.description,
                    body: args.body ?? current?.body,
                    enabled: args.enabled ?? current?.enabled ?? true,
                    all_bots: args.all_bots ?? current?.all_bots ?? false,
                },
            });

            const changes = skillProposalChanges({ data, current });

            if (current && !changes.fields.length) {
                throw new Error(
                    `That changes nothing: it's skill #${current.id} exactly as saved${args.body === undefined ? " (you sent no body, so the runbook stayed the saved one)" : ""}. Send what should change, the whole new runbook in body.`,
                );
            }

            if (changes.body_changed) await assertSkillBodyFits({ body: data.body });

            const id = await createExtensionProposal({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                kind: "skill",
                data,
                research: args.research,
                sources: args.sources,
            });

            onPropose?.({ ref: proposalRef({ id }) });

            return describeProposalForBot({
                view: await grabExtensionProposalView({ proposal_id: id, user_id }),
                skill_changes: current ? changes : undefined,
            });
        },
    };
}
