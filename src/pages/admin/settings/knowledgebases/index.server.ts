import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";

/**
 * Super admins and admins: admins only choose who gets each knowledgebase.
 * Documents load when a knowledgebase's documents are opened.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            knowledgebases_overview: await grabKnowledgebasesOverview({ user_id: settings.props.person.id }),
        },
    };
};
