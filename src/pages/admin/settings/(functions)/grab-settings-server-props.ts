import userAuth from "@/src/functions/backend/auth/user-auth";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import sanitizeUserBio from "@/src/functions/backend/db/users/sanitize-user-bio";
import grabUserPasswordHash from "@/src/functions/backend/auth/grab-user-password-hash";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabRunLimitsOverview from "@/src/functions/backend/db/app-settings/grab-run-limits";
import grabSkillLimitsOverview from "@/src/functions/backend/db/app-settings/grab-skill-limits";
import grabStorageQuotaOverview from "@/src/functions/backend/db/app-settings/grab-storage-quota-overview";
import { grabSystemPromptAppendOverview } from "@/src/functions/backend/db/app-settings/grab-system-prompt-append";
import runningVersion from "@/src/utils/running-version";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * Shared server props for the `/admin/settings` sub-pages.
 */
export default async function grabSettingsServerProps({ req }: Params) {
    const { user } = await userAuth({ req });

    if (!user?.id) {
        return {
            redirect: {
                destination: "/auth/login",
            },
        };
    }

    const user_res = await grabUsers({ user_id: user.id });

    if (!user_res.singleRes) {
        return {
            redirect: {
                destination: AdminHomePath,
            },
        };
    }

    const has_password = Boolean(
        await grabUserPasswordHash({ user_id: user.id }),
    );

    return {
        props: {
            person: sanitizeUserBio({ user: user_res.singleRes }),
            has_password,
            storage_quota: await grabStorageQuotaOverview().catch(() => null),
            system_prompt_append: await grabSystemPromptAppendOverview().catch(() => null),
            run_limits: await grabRunLimitsOverview().catch(() => null),
            skill_limits: await grabSkillLimitsOverview().catch(() => null),
            running_version: runningVersion({ env: process.env }),
        },
    };
}
