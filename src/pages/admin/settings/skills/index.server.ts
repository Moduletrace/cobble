import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabSkillsOverview from "@/src/functions/backend/db/extensions/grab-skills-overview";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";

/**
 * Super admins and admins: admins only choose who gets each skill.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            skills_overview: await grabSkillsOverview({ user_id: settings.props.person.id }),
        },
    };
};
