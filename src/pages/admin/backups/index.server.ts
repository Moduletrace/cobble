import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabBackupsServerProps from "./(functions)/grab-backups-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    return await grabBackupsServerProps(params);
};
