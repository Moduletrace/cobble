import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";
import railBots from "@/src/utils/rail-bots";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            bots: railBots({ bots: await grabBots({ user_id: settings.props.person.id }) }),
        },
    };
};
