import type { PushPayload } from "@/src/dict/push-dict";
import grabPushSubscriptions from "@/src/functions/backend/db/push/grab-push-subscriptions";
import grabInstallIcon from "@/src/functions/backend/db/app-settings/grab-install-icon";
import installIconBase from "@/src/utils/install-icon-base";
import sendWebPush from "./send-web-push";

/**
 * Sends to every device the user subscribed, with the install's own icon
 * when it has one. Best effort: one failed device does not stop the
 * others.
 */
export default async function deliverToUser({
    user_id,
    payload,
}: {
    user_id: number | string;
    payload: PushPayload;
}) {
    const subscriptions = await grabPushSubscriptions({ user_id });

    if (!subscriptions.length) return;

    const icon_base = installIconBase({ icon: await grabInstallIcon().catch(() => null) });
    const sent = icon_base ? { ...payload, icon: `${icon_base}/icon-192.png` } : payload;

    await Promise.all(
        subscriptions.map((subscription) =>
            sendWebPush({ subscription, payload: sent }),
        ),
    );
}
