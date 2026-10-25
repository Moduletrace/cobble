import grabCrewRole from "@/src/functions/backend/db/access/grab-crew-role";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number | string;
};

/**
 * Throws unless the run's user is the super admin, who alone defines the
 * install's skills, MCP servers and tools. The coordinator only runs for
 * them, but the tools check again on every call, so a user who lost the
 * role mid-session can't change them.
 */
export default async function assertSuperAdminRun({ user_id }: Params) {
    if ((await grabCrewRole({ user_id })) != "super_admin") {
        throw new AppError(`Only the super admin can change the install's skills, MCP servers and tools.`);
    }
}
