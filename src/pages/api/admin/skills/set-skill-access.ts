import userAuth from "@/src/functions/backend/auth/user-auth";
import grabSkillsOverview from "@/src/functions/backend/db/extensions/grab-skills-overview";
import setExtensionAccess from "@/src/functions/backend/db/extensions/set-extension-access";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SetExtensionAccessRequestSchema } from "@/src/schemas/extension-schema";
import type { SkillsOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admins and admins: attaches a skill to exactly these bots and
 * workspaces. Only a super admin sets "all bots" (`setExtensionAccess`).
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<SkillsOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const access = parseWithSchema({ schema: SetExtensionAccessRequestSchema, data: body });

        await setExtensionAccess({ user_id: user.id, kind: "skill", ...access });

        await logEvent({
            title: "Skill access changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} changed who gets the skill #${access.id}.`,
            metadata: access,
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved who gets it.`,
            singleRes: await grabSkillsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
