import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            bots: await grabBots({ user_id: settings.props.person.id }),
        },
    };
};
