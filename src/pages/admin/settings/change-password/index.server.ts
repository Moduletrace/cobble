import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    return await grabSettingsServerProps(params);
};
