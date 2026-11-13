import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { GeneralSettingsAudiences, GeneralSettingsRoot, findGeneralSettingsSection } from "@/src/dict/general-settings-dict";
import type { GeneralSettingsSectionValues } from "@/src/dict/general-settings-dict";
import grabGeneralSettingsValues from "@/src/functions/backend/db/app-settings/grab-general-settings-values";
import grabPushOverview from "@/src/functions/backend/db/push/grab-push-overview";
import { ensureVapidKeys } from "@/src/push/vapid";
import grabSettingsServerProps from "../../(functions)/grab-settings-server-props";

/**
 * One group of General settings on its own page, the one a bot sends
 * someone to when a limit in it stopped work. The group itself is what
 * the page shows; the serializer fills in its live values.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const query: PageQueryObject = params.query;
    const section = findGeneralSettingsSection({ key: String(query["section"] ?? "") });

    if (!section) {
        return {
            redirect: {
                destination: GeneralSettingsRoot,
                permanent: false,
            },
        };
    }

    const [sections, keys] = await Promise.all([
        grabGeneralSettingsValues(),
        ensureVapidKeys().catch(() => null),
    ]);

    const general_section: GeneralSettingsSectionValues =
        sections.find((row) => row.key == section.key) || {
            key: section.key,
            title: section.title,
            href: `${GeneralSettingsRoot}/${section.key}`,
            editor: GeneralSettingsAudiences[section.editable_by],
            editable_by: section.editable_by,
            values: [],
        };

    return {
        props: {
            ...settings.props,
            general_section,
            push_overview: await grabPushOverview({
                user_id: settings.props.person.id,
                public_key: keys?.public_key || null,
            }),
        },
    };
};