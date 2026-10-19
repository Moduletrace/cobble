import type { PushOverview } from "@/src/types";
import describePushDevice from "@/src/utils/describe-push-device";
import grabPushSubscriptions from "./grab-push-subscriptions";

/**
 * What the Notifications settings page shows: the public key a device
 * subscribes with, and the user's devices without their endpoints (a
 * push endpoint is a capability URL).
 */
export default async function grabPushOverview({
    user_id,
    public_key,
}: {
    user_id: number | string;
    public_key?: string | null;
}): Promise<PushOverview> {
    const subscriptions = await grabPushSubscriptions({ user_id });

    return {
        public_key: public_key || null,
        subscriptions: subscriptions.map((subscription) => ({
            id: Number(subscription.id),
            device: describePushDevice({
                user_agent: subscription.user_agent,
                platform: subscription.platform,
            }),
            created_at: Number(subscription.created_at) || 0,
            last_used_at: Number(subscription.last_used_at) || 0,
            last_error: subscription.last_error || null,
        })),
    };
}
