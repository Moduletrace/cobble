"use client";

import { useEffect, useRef } from "react";
import { PwaServiceWorkerPath } from "@/src/data/pwa-data";
import clearDevelopmentServiceWorker from "@/src/functions/frontend/clear-development-service-worker";

const UpdateCheckMs = 60 * 60 * 1000;
/**
 * Development only: waits out a `clients.claim` that raced the clear, so
 * the clearing reload doesn't come back controlled by the old worker.
 */
const DevelopmentClearRetryMs = 3000;
/**
 * Development only: guards against reloading in a loop when the worker
 * can't be cleared (a restricted profile, say).
 */
const DevelopmentClearAttemptsKey = "cobble-dev-sw-clear";
const DevelopmentClearMaxAttempts = 3;

/**
 * Registers the app's service worker (production only, so development
 * HMR is never cached) and checks for a new one hourly and whenever the
 * app comes back into view. A new worker takes over by itself
 * (`public/sw.js`), so there is nothing to offer and nothing reloads: a
 * bot reply may be running. New builds reach the device through the
 * loading page.
 *
 * In development it does the opposite: it clears the worker and the
 * caches a production deploy left on the device, so the dev server's
 * code is never served from a build's cache (see
 * `clear-development-service-worker.ts`).
 */
export default function ServiceWorkerRegistrar() {
    const registration = useRef<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (process.env.NODE_ENV != "production") return;
        if (typeof navigator == "undefined") return;
        if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

        let cancelled = false;
        let interval: ReturnType<typeof setInterval> | undefined;

        navigator.serviceWorker
            .register(PwaServiceWorkerPath, {
                scope: "/",
                updateViaCache: "none",
            })
            .then((reg) => {
                if (cancelled) return;
                registration.current = reg;
                interval = setInterval(() => reg.update().catch(() => {}), UpdateCheckMs);
            })
            .catch((error) => {
                console.log("Service worker registration failed:", error);
            });

        const checkOnVisible = () => {
            if (document.visibilityState == "visible") {
                registration.current?.update().catch(() => {});
            }
        };

        document.addEventListener("visibilitychange", checkOnVisible);

        return () => {
            cancelled = true;
            if (interval) clearInterval(interval);
            document.removeEventListener("visibilitychange", checkOnVisible);
        };
    }, []);

    useEffect(() => {
        if (process.env.NODE_ENV == "production") return;
        if (typeof navigator == "undefined") return;
        if (!("serviceWorker" in navigator)) return;

        let cancelled = false;
        let retry: ReturnType<typeof setTimeout> | undefined;

        /**
         * A worker claimed this tab while clearing or right after it:
         * clear again, then reload into the uncontrolled tab. Without
         * this, the reload would land back on the cached build.
         */
        const onControllerChange = () => {
            if (cancelled) return;

            retry = setTimeout(() => {
                if (cancelled) return;

                clearDevelopmentServiceWorker()
                    .then((cleared) => {
                        if (!cancelled && cleared) window.location.reload();
                    })
                    .catch(() => undefined);
            }, DevelopmentClearRetryMs);
        };

        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        clearDevelopmentServiceWorker()
            .then((cleared) => {
                if (cancelled) return;
                if (!cleared) {
                    window.sessionStorage.removeItem(DevelopmentClearAttemptsKey);
                    return;
                }

                /**
                 * This load is still the old worker's code: one reload
                 * takes the dev server's, twice at most.
                 */
                const attempts = Number(
                    window.sessionStorage.getItem(DevelopmentClearAttemptsKey) || 0,
                );

                if (attempts >= DevelopmentClearMaxAttempts) return;

                window.sessionStorage.setItem(
                    DevelopmentClearAttemptsKey,
                    String(attempts + 1),
                );
                window.location.reload();
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
            if (retry) clearTimeout(retry);
            navigator.serviceWorker.removeEventListener(
                "controllerchange",
                onControllerChange,
            );
        };
    }, []);

    return null;
}
