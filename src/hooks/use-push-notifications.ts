"use client";

import { useCallback, useEffect, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import useInstallPrompt from "@/src/hooks/use-install-prompt";
import urlBase64ToUint8Array from "@/src/utils/url-base64-to-uint8-array";
import { PwaServiceWorkerPath } from "@/src/data/pwa-data";

export type PushDeviceState =
    | "loading"
    | "dev"
    | "unsupported"
    | "needs-install"
    | "denied"
    | "off"
    | "on";

/**
 * The registrant may still be registering when Settings opens, so give it
 * a moment before deciding the browser has no worker.
 */
async function grabRegistration() {
    const existing = await navigator.serviceWorker.getRegistration();

    if (existing) return existing;

    return await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 4000)),
    ]);
}

/**
 * One device's Web Push subscription. Permission is only ever asked for
 * from an explicit tap: a denied permission is permanent in most browsers
 * and iOS requires the gesture. In development the service worker is not
 * registered, so this reports "dev" instead of hanging.
 */
export default function usePushNotifications({
    public_key,
}: {
    public_key?: string | null;
}) {
    const { is_ios, is_standalone } = useInstallPrompt();
    const [state, setState] = useState<PushDeviceState>("loading");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();

    const read_subscription = useCallback(async () => {
        if (process.env.NODE_ENV != "production") {
            setState("dev");
            return null;
        }

        if (
            typeof navigator == "undefined" ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window) ||
            !("Notification" in window)
        ) {
            setState("unsupported");
            return null;
        }

        if (is_ios && !is_standalone) {
            setState("needs-install");
            return null;
        }

        if (Notification.permission == "denied") {
            setState("denied");
            return null;
        }

        const registration = await grabRegistration();

        if (!registration) {
            setState("unsupported");
            return null;
        }

        const subscription =
            await registration.pushManager.getSubscription();

        setState(subscription ? "on" : "off");

        return subscription;
    }, [is_ios, is_standalone]);

    useEffect(() => {
        read_subscription().catch(() => setState("unsupported"));
    }, [read_subscription]);

    const enable = async () => {
        if (!public_key) {
            setError("Notifications aren't set up on this server yet.");
            return false;
        }

        setBusy(true);
        setError(undefined);

        try {
            const permission = await Notification.requestPermission();

            if (permission != "granted") {
                setState(permission == "denied" ? "denied" : "off");
                setError(
                    permission == "denied"
                        ? "Notifications are blocked for this site. Allow them in the browser's site settings, then try again."
                        : "Notifications were not allowed.",
                );
                return false;
            }

            /**
             * The registrant normally registers, but a settings page can
             * be the first thing opened.
             */
            const registration = await navigator.serviceWorker.register(
                PwaServiceWorkerPath,
                { scope: "/", updateViaCache: "none" },
            );

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(public_key),
            });

            const res = await fetchApi("/api/admin/push/subscribe", {
                method: "POST",
                body: {
                    endpoint: subscription.endpoint,
                    keys: subscription.toJSON().keys,
                    user_agent: navigator.userAgent,
                    platform: navigator.platform,
                },
            });

            if (!res.success) {
                await subscription.unsubscribe().catch(() => {});
                setError(res.msg || "Notifications could not be turned on.");
                setState("off");
                return false;
            }

            setState("on");
            return true;
        } catch (caught: any) {
            setError(
                caught?.message || "Notifications could not be turned on.",
            );
            return false;
        } finally {
            setBusy(false);
        }
    };

    const disable = async () => {
        setBusy(true);
        setError(undefined);

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const subscription = await registration?.pushManager.getSubscription();

            if (subscription) {
                await fetchApi("/api/admin/push/unsubscribe", {
                    method: "POST",
                    body: { endpoint: subscription.endpoint },
                });
                await subscription.unsubscribe();
            }

            setState("off");
            return true;
        } catch (caught: any) {
            setError(
                caught?.message || "Notifications could not be turned off.",
            );
            return false;
        } finally {
            setBusy(false);
        }
    };

    const send_test = async () => {
        setBusy(true);
        setError(undefined);

        try {
            const res = await fetchApi<{}, APIResponseObject>(
                "/api/admin/push/test",
                { method: "POST", body: {} },
            );

            if (!res.success) {
                setError(res.msg || "The test could not be sent.");
                return false;
            }

            return true;
        } catch (caught: any) {
            setError(caught?.message || "The test could not be sent.");
            return false;
        } finally {
            setBusy(false);
        }
    };

    /**
     * The browser rotated the subscription. Re-subscribing needs the key
     * and the session, so the page does it.
     */
    useEffect(() => {
        if (process.env.NODE_ENV != "production") return;
        if (!("serviceWorker" in navigator)) return;

        const onMessage = (event: MessageEvent) => {
            if (event.data?.type != "PUSH_RESUBSCRIBE") return;
            event.data.oldEndpoint &&
                fetchApi("/api/admin/push/unsubscribe", {
                    method: "POST",
                    body: { endpoint: event.data.oldEndpoint },
                }).catch(() => {});
            enable().catch(() => {});
        };

        navigator.serviceWorker.addEventListener("message", onMessage);
        return () =>
            navigator.serviceWorker.removeEventListener("message", onMessage);
    }, [public_key]);

    return {
        state,
        enabled: state == "on",
        busy,
        error,
        clearError: () => setError(undefined),
        enable,
        disable,
        send_test,
    };
}
