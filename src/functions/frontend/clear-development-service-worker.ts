/**
 * Development must run on the dev server's code, never on what an
 * earlier production build left on the device. The worker registered by
 * a production deploy keeps controlling this origin (`clients.claim`),
 * and it serves every `/.bunext/public/*` file cache first without
 * knowing which build asked, while every cache-busting mechanism the app
 * has (the precache gate, `/build-info.json`, the loading page) is
 * production only. So in development the worker is unregistered and
 * every cache it wrote is dropped once, then the page reloads into an
 * uncontrolled tab.
 *
 * Returns whether anything was cleared, so the caller only reloads when
 * there was something to clear.
 */
export default async function clearDevelopmentServiceWorker(): Promise<boolean> {
    if (typeof navigator == "undefined") return false;
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return false;

    let cleared = false;

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
            registrations.map(async (registration) => {
                cleared = true;

                /**
                 * The worker's own caches go first, while it still owns
                 * them, so nothing writes a build back mid-clear.
                 */
                await registration.unregister().catch(() => undefined);
            }),
        );
    } catch (error) {
        return false;
    }

    if ("caches" in window) {
        try {
            const keys = await caches.keys();

            if (keys.length > 0) cleared = true;

            await Promise.all(
                keys.map((key) => caches.delete(key).catch(() => false)),
            );
        } catch (error) {
            // A device with caches disabled still runs the dev server.
        }
    }

    return cleared;
}
