import AppError from "@/src/utils/app-error";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    user_id: number | string;
};

/**
 * Throws unless the user is a super admin. A host directory is a folder on
 * the machine running Cobble, outside anything the app keeps, so only the
 * install's owner decides what a computer may mount and write in.
 */
export default async function assertHostDirectoryManager({ user_id }: Params) {
    if ((await grabCrewRole({ user_id })) != "super_admin") {
        throw new AppError(
            `Only a super admin can add or change host directories, since a mounted folder is on the host machine itself.`,
        );
    }
}