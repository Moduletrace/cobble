import AppError from "@/src/utils/app-error";
import grabCrewRole from "./grab-crew-role";

type Params = {
    user_id: number | string;
};

/**
 * Throws unless the user manages the crew (a super admin or an admin).
 * Returns their role.
 */
export default async function assertCrewManager({ user_id }: Params) {
    const role = await grabCrewRole({ user_id });

    if (role == "member") {
        throw new AppError(`Only an admin can do that.`);
    }

    return role;
}
