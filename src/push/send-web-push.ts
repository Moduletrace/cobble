import webpush from "web-push";
import type { BUN_SQLITE_COBBLE_PUSH_SUBSCRIPTIONS } from "@/db/types/db";
import type { PushPayload } from "@/src/dict/push-dict";
import { AppData } from "@/src/data/app-data";
import { logError } from "@/src/functions/backend/logger";
import markPushSubscription, {
    deleteGonePushSubscription,
} from "@/src/functions/backend/db/push/mark-push-subscription";
import { configureWebPush } from "./vapid";

type Params = {
    subscription: BUN_SQLITE_COBBLE_PUSH_SUBSCRIPTIONS;
    payload: PushPayload;
};

/**
 * Sends one notification and records how it went. A device the push
 * service no longer knows is removed. Never throws: a notification is
 * never worth failing the work that produced it.
 */
export default async function sendWebPush({ subscription, payload }: Params) {
    try {
        const keys = await configureWebPush();

        if (!keys) return false;

        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint || "",
                keys: {
                    p256dh: subscription.p256dh || "",
                    auth: subscription.auth || "",
                },
            },
            JSON.stringify(payload),
            {
                TTL: AppData.PushTtlSeconds,
                urgency: payload.requireInteraction ? "high" : "normal",
            },
        );

        await markPushSubscription({ endpoint: subscription.endpoint || "" });

        return true;
    } catch (error: any) {
        const status = Number(error?.statusCode);

        if (status == 404 || status == 410) {
            await deleteGonePushSubscription({
                endpoint: subscription.endpoint || "",
            }).catch(() => {});
            return false;
        }

        await markPushSubscription({
            endpoint: subscription.endpoint || "",
            error: error?.message || "Send failed",
        }).catch(() => {});

        await logError({
            title: "Web Push send failed",
            error,
            metadata: { endpoint: subscription.endpoint?.slice(0, 120) },
        }).catch(() => {});

        return false;
    }
}
