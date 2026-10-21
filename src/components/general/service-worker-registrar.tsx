"use client";

import { useEffect, useRef, useState } from "react";
import Paper from "@moduletrace/twui/elements/Paper";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import { RefreshCw } from "lucide-react";
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
 * HMR is never cached) and offers a reload once a new version is
 * installed. It never reloads on its own: a bot reply may be running.
 *
 * In development it does the opposite: it clears the worker and the
 * caches a production deploy left on the device, so the dev server's
 * code is never served from a build's cache (see
 * `clear-development-service-worker.ts`).
 */
export default function ServiceWorkerRegistrar() {
    const [update_ready, setUpdateReady] = useState(false);
    const [reloading, setReloading] = useState(false);
    const registration = useRef<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (process.env.NODE_ENV != "production") return;
        if (typeof navigator == "undefined") return;
        if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

        let cancelled = false;
        let interval: ReturnType<typeof setInterval> | undefined;

        const watch = (reg: ServiceWorkerRegistration) => {
            if (reg.waiting && navigator.serviceWorker.controller) {
                setUpdateReady(true);
            }

            reg.addEventListener("updatefound", () => {
                const installing = reg.installing;

                installing?.addEventListener("statechange", () => {
                    if (cancelled) return;
                    if (
                        installing.state == "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        setUpdateReady(true);
                    }
                });
            });
        };

        navigator.serviceWorker
            .register(PwaServiceWorkerPath, {
                scope: "/",
                updateViaCache: "none",
            })
            .then((reg) => {
                if (cancelled) return;
                registration.current = reg;
                watch(reg);
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

    useEffect(() => {
        if (!reloading) return;

        const onControllerChange = () => window.location.reload();
        navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
        registration.current?.waiting?.postMessage({ type: "SKIP_WAITING" });
        const fallback = setTimeout(() => window.location.reload(), 1500);

        return () => {
            clearTimeout(fallback);
            navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
        };
    }, [reloading]);

    if (!update_ready) return null;

    return (
        <Paper
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 z-[250] w-[min(320px,calc(100vw-32px))] gap-3! p-4 bg-surface shadow-popover! border-hairline dark:bg-surface dark:border-hairline"
        >
            <Span className="text-sm font-bold leading-5 text-ink">
                A new version is ready
            </Span>
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                Reload to use it. Your conversations are saved.
            </Span>
            <Row className="gap-2! flex-nowrap justify-end">
                <Button
                    title="Reload later"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    disabled={reloading}
                    onClick={() => setUpdateReady(false)}
                >
                    Later
                </Button>
                <Button
                    title="Reload the app"
                    type="button"
                    size="small"
                    loading={reloading}
                    beforeIcon={<RefreshCw size={15} />}
                    onClick={() => setReloading(true)}
                >
                    Reload
                </Button>
            </Row>
        </Paper>
    );
}
