import { grabSkillBodyMaxChars } from "../app-settings/grab-skill-limits";
import AppError from "@/src/utils/app-error";

type Params = {
    body: string;
};

/**
 * Refuses a runbook longer than the install's limit (Settings > General).
 * The request schemas only hold the ceiling, since the limit is a setting.
 */
export default async function assertSkillBodyFits({ body }: Params) {
    const max = await grabSkillBodyMaxChars();

    if (body.length > max) {
        throw new AppError(
            `Keep the runbook under ${max} characters (it has ${body.length}). A super admin can raise the limit on Settings > General.`,
        );
    }
}
