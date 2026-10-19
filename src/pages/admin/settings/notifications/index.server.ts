import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabPushOverview from "@/src/functions/backend/db/push/grab-push-overview";
import { ensureVapidKeys } from "@/src/push/vapid";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * The Notifications page: this user's devices and the public key a new
 * device subscribes with.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const keys = await ensureVapidKeys().catch(() => null);

    return {
        props: {
            ...settings.props,
            push_overview: await grabPushOverview({
                user_id: settings.props.person.id,
                public_key: keys?.public_key || null,
            }),
        },
    };
};
