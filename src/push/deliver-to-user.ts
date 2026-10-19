import type { PushPayload } from "@/src/dict/push-dict";
import grabPushSubscriptions from "@/src/functions/backend/db/push/grab-push-subscriptions";
import sendWebPush from "./send-web-push";

/**
 * Sends to every device the user subscribed. Best effort: one failed
 * device does not stop the others.
 */
export default async function deliverToUser({
    user_id,
    payload,
}: {
    user_id: number | string;
    payload: PushPayload;
}) {
    const subscriptions = await grabPushSubscriptions({ user_id });

    await Promise.all(
        subscriptions.map((subscription) =>
            sendWebPush({ subscription, payload }),
        ),
    );
}
