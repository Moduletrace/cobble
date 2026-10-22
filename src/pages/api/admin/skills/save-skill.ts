import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabSkillsOverview from "@/src/functions/backend/db/extensions/grab-skills-overview";
import saveSkill from "@/src/functions/backend/db/extensions/save-skill";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveSkillRequestSchema } from "@/src/schemas/extension-schema";
import type { SkillsOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: adds or edits a skill.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<SkillsOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const data = parseWithSchema({ schema: SaveSkillRequestSchema, data: body });
        const skill_id = await saveSkill({ user_id: user.id, data });

        await logEvent({
            title: data.skill_id ? "Skill changed" : "Skill added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${data.skill_id ? "changed" : "added"} the skill ${data.name} (#${skill_id}, ${data.slug}).`,
            metadata: { skill_id, slug: data.slug },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${data.name}.`,
            singleRes: await grabSkillsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
