import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteSkill from "@/src/functions/backend/db/extensions/delete-skill";
import grabSkillsOverview from "@/src/functions/backend/db/extensions/grab-skills-overview";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SkillIdRequestSchema } from "@/src/schemas/extension-schema";
import type { SkillsOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: deletes a skill. Bots lose it at once.
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

        const { skill_id } = parseWithSchema({ schema: SkillIdRequestSchema, data: body });
        const skill = await deleteSkill({ skill_id });

        await logEvent({
            title: "Skill deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the skill ${skill.name} (#${skill.id}, ${skill.slug}).`,
            metadata: { skill_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Deleted ${skill.name}.`,
            singleRes: await grabSkillsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
