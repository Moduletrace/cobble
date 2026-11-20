import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { AppData } from "@/src/data/app-data";

type RefView = { [k: string]: any };

type Params = {
    /**
     * What the view is, e.g. `suggestion:12`, so two chips naming the same
     * one ask once.
     */
    key: string;
    url: string;
    /**
     * How to read it once. The real one asks the app over HTTP.
     */
    readOnce?: (params: { url: string }) => Promise<unknown | null>;
    /**
     * Waits between tries, the last one after the final try; tests pass
     * their own.
     */
    retryDelaysMs?: readonly number[];
};

/**
 * Views already read, by key, so a thread naming one twice asks once, and
 * the reads in flight. Only what was read is kept: a read that failed is
 * forgotten, so the next chip naming it asks again instead of sitting on
 * "(not available)" for the life of the page.
 */
const known = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown | null>>();

type RefViewListener = (view: RefView) => void;

/**
 * Who is showing one view on the page now, by key. A bot's message can
 * carry the same card twice (the one that made it, and a later one saying
 * it's still waiting), and each chip keeps its own state, so without this
 * the other card went on saying "Waiting for you" after the user decided
 * on it, until a reload.
 */
const listeners = new Map<string, Set<RefViewListener>>();

/**
 * Follows one view, so a change another chip made reaches this one:
 * returns the unsubscribe. Called before the read, since a card decided
 * while it loads must not be overwritten by the answer already in flight.
 */
export function subscribeRefView({ key, listener }: { key: string; listener: RefViewListener }) {
    const listening = listeners.get(key) || new Set<RefViewListener>();

    listening.add(listener);
    listeners.set(key, listening);

    return () => {
        listening.delete(listener);

        if (!listening.size) listeners.delete(key);
    };
}

/**
 * Keeps a view the page already has (a question answered in its card, its
 * chip now saying so) without asking the app for it again, and tells every
 * chip naming it, so they all say so.
 */
export function primeRefView({ key, view }: { key: string; view: unknown }) {
    remember({ key, view });
}

function remember({ key, view }: { key: string; view: unknown }) {
    known.set(key, view);

    for (const listener of listeners.get(key) || []) listener(view as RefView);
}

/**
 * Reads a ref's view (`[suggestion:ID]`, `[question:ID]`, ...), once here
 * and over HTTP after. A read that fails or hangs is tried again, since
 * the ref can be named before its row is written (a bot writing its own
 * id, a page woken from a long sleep mid-request), and the reload that
 * used to be the only cure is what this saves the user.
 */
export default async function loadRefView<T extends RefView>({
    key,
    url,
    readOnce = readRefViewOnce,
    retryDelaysMs = AppData.BotRefViewRetryDelaysMs,
}: Params): Promise<T | null> {
    const cached = known.get(key);

    if (cached) return cached as T;

    const reading = inFlight.get(key);

    if (reading) return reading as Promise<T | null>;

    const request = readWithRetries({ url, readOnce, retryDelaysMs })
        .then((view) => {
            inFlight.delete(key);

            if (view) remember({ key, view });

            return view as T | null;
        })
        .catch(() => {
            inFlight.delete(key);

            return null;
        });

    inFlight.set(key, request);

    return request;
}

async function readWithRetries({ url, readOnce, retryDelaysMs }: Required<Pick<Params, "url" | "readOnce" | "retryDelaysMs">>) {
    for (let attempt = 0; ; attempt += 1) {
        if (attempt) await sleep({ ms: retryDelaysMs[attempt - 1] || 0 });

        const view = await readOnce({ url }).catch(() => null);

        if (view || attempt >= retryDelaysMs.length) return view;
    }
}

async function readRefViewOnce({ url }: { url: string }): Promise<unknown | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AppData.BotRefViewTimeoutMs);

    try {
        const res = await fetchApi<{}, APIResponseObject<RefView>>(url, {
            method: "GET",
            fetchOptions: { signal: controller.signal },
        });

        return res?.success && res.singleRes ? res.singleRes : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function sleep({ ms }: { ms: number }) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}