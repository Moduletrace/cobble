import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabUsageServerProps from "./(functions)/grab-usage-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    return await grabUsageServerProps(params);
};
