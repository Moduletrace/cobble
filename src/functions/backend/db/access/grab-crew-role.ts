import crewRole from "@/src/utils/rbac/crew-role";
import grabUserTypes from "../users/grab-user-types";

type Params = {
    user_id: number | string;
};

/**
 * A user's `crewRole`, read from their user types.
 */
export default async function grabCrewRole({ user_id }: Params) {
    return crewRole({ user_types: await grabUserTypes({ user_id }) });
}
