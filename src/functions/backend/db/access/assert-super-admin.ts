import AppError from "@/src/utils/app-error";
import grabCrewRole from "./grab-crew-role";

type Params = {
    user_id: number | string;
};

/**
 * Throws unless the user is the install's super admin. Global and workspace
 * access to connectors is theirs alone.
 */
export default async function assertSuperAdmin({ user_id }: Params) {
    const role = await grabCrewRole({ user_id });

    if (role != "super_admin") throw new AppError(`Only a super admin can do that.`);

    return role;
}