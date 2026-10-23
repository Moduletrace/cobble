import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabDatabaseServerProps from "./(functions)/grab-database-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    return await grabDatabaseServerProps(params);
};
