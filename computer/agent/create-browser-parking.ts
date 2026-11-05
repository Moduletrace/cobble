import log from "./log";
import openCdpConnection, { type CdpConnection } from "./open-cdp-connection";
import parkBrowserTabs, { type ParkedTab } from "./park-browser-tabs";
import shouldParkBrowser from "./should-park-browser";
import unparkBrowserTabs from "./unpark-browser-tabs";

type Params = {
    /**
     * Chrome's DevTools port, on loopback.
     */
    cdp_port: number;
    /**
     * Unused and unwatched this long parks the browser; 0 never does.
     */
    park_after_ms: number;
    /**
     * How often idleness is checked.
     */
    check_every_ms?: number;
};

export type BrowserParking = {
    /**
     * Someone is about to use the browser: brings parked tabs back first.
     * Resolves once it's as it was left (never rejects).
     */
    wake: () => Promise<void>;
    /**
     * A browser tool call started: nothing is parked until `done` runs.
     */
    hold: () => { done: () => void };
    /**
     * A screen view opened: brings the tabs back and parks nothing while
     * it's open. Returns what to call when it closes.
     */
    watch: () => { done: () => void };
    /**
     * Chrome started again: its old tabs are gone, so nothing is parked.
     */
    browserRestarted: () => void;
};

const CdpTimeoutMs = 10_000;

/**
 * Keeps an idle browser from burning CPU. The computer's screen has no GPU
 * and no window manager, so the tab in front is always "on show" and its
 * animations are drawn in software at full rate even when nobody watches.
 * After `park_after_ms` without a browser tool call or a screen view,
 * every site on show goes to the background behind a blank tab
 * (`parkBrowserTabs`), what a person switching tabs does, so pages see
 * nothing out of the ordinary; the next tool call or view brings them back
 * before it goes through. One operation at a time.
 */
export default function createBrowserParking({ cdp_port, park_after_ms, check_every_ms = 15_000 }: Params): BrowserParking {
    let last_active_at = Date.now();
    let checked_at = 0;
    let viewers = 0;
    let holds = 0;
    let parked: ParkedTab[] = [];
    let queue: Promise<void> = Promise.resolve();
    let parking = false;

    const touch = () => {
        last_active_at = Date.now();
    };

    /**
     * Runs one operation after the ones before it, over its own DevTools
     * connection.
     */
    const run = (task: (cdp: CdpConnection) => Promise<void>) => {
        queue = queue.then(async () => {
            let cdp: CdpConnection | undefined;

            try {
                cdp = await openCdpConnection({ port: cdp_port, timeout_ms: CdpTimeoutMs });
                await task(cdp);
            } catch (error: any) {
                log({ name: "parking", message: `couldn't reach the browser: ${error?.message || error}` });
            } finally {
                cdp?.close();
            }
        });

        return queue;
    };

    const idle = () =>
        shouldParkBrowser({ now: Date.now(), last_active_at, checked_at, viewers, holds, park_after_ms });

    const park = () =>
        run(async (cdp) => {
            // Used again while it waited its turn.
            if (!idle()) return;

            const tabs = await parkBrowserTabs({ cdp });

            checked_at = Date.now();
            parked.push(...tabs);

            if (tabs.length) log({ name: "parking", message: `idle: parked ${tabs.length} tab${tabs.length == 1 ? "" : "s"}` });
        });

    const wake = () => {
        touch();

        // Quick when nothing is parked or being parked (a park waiting its
        // turn sees the browser in use and does nothing).
        if (!parked.length && !parking) return Promise.resolve();

        return run(async (cdp) => {
            if (!parked.length) return;

            const tabs = parked;

            parked = [];
            await unparkBrowserTabs({ cdp, parked: tabs });
            log({ name: "parking", message: `in use: brought back ${tabs.length} tab${tabs.length == 1 ? "" : "s"}` });
        });
    };

    if (park_after_ms > 0) {
        setInterval(() => {
            if (parking || !idle()) return;

            parking = true;
            park().finally(() => {
                parking = false;
            });
        }, check_every_ms).unref();
    }

    return {
        wake,
        hold: () => {
            holds++;
            touch();

            let released = false;

            return {
                done: () => {
                    if (released) return;
                    released = true;
                    holds--;
                    touch();
                },
            };
        },
        watch: () => {
            viewers++;
            wake();

            let released = false;

            return {
                done: () => {
                    if (released) return;
                    released = true;
                    viewers--;
                    touch();
                },
            };
        },
        browserRestarted: () => {
            parked = [];
            checked_at = 0;
            touch();
        },
    };
}
