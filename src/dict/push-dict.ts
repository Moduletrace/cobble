import { AppData } from "@/src/data/app-data";

/**
 * A notification's payload. The service worker turns it into a
 * notification; `url` is where clicking it goes.
 */
export type PushPayload = {
    title: string;
    body: string;
    url: string;
    tag: string;
    requireInteraction?: boolean;
};

/**
 * One conversation replaces its previous notification, so a burst does not
 * stack. A needs-you notice has its own tag.
 */
export function pushMessageTag({
    bot_id,
    session_id,
}: {
    bot_id: number | string;
    session_id: number | string;
}) {
    return `bot-${bot_id}-session-${session_id}`;
}

export function pushNeedsYouTag({ bot_id }: { bot_id: number | string }) {
    return `bot-${bot_id}-needs-you`;
}

export function truncatePushBody(text: string) {
    const limit = AppData.PushBodyMaxChars;

    if (text.length <= limit) return text;

    return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export const PushDefaultIcon = "/icons/icon-192.png";
