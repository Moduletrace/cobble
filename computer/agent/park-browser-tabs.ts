import type { CdpConnection } from "./open-cdp-connection";
import pageNeedsParking from "./page-needs-parking";

export type ParkedTab = {
    /**
     * The site's tab, sent to the background.
     */
    page_id: string;
    /**
     * The blank tab put in front of it.
     */
    blank_id: string;
};

type TargetInfo = { targetId: string; type: string; url: string };

/**
 * Sends every site on show to the background, as a person switching tabs
 * would: a blank tab opens in front of it in its window. A background tab
 * keeps its connections and logins, but Chrome stops drawing it and slows
 * its timers, so it costs next to nothing (in front, the virtual screen's
 * software rendering draws its animations at full rate whether or not
 * anyone watches). Returns what to bring back.
 */
export default async function parkBrowserTabs({ cdp }: { cdp: CdpConnection }): Promise<ParkedTab[]> {
    const { targetInfos } = (await cdp.send({ method: "Target.getTargets" })) as { targetInfos: TargetInfo[] };
    const parked: ParkedTab[] = [];

    for (const target of targetInfos) {
        if (target.type != "page" || !pageNeedsParking({ url: target.url })) continue;
        if (!(await isOnShow({ cdp, target_id: target.targetId }))) continue;

        // In front of its own window: a new tab opens in the window used last.
        await cdp.send({ method: "Target.activateTarget", params: { targetId: target.targetId } });

        const { targetId } = (await cdp.send({ method: "Target.createTarget", params: { url: "about:blank" } })) as {
            targetId: string;
        };

        parked.push({ page_id: target.targetId, blank_id: targetId });
    }

    return parked;
}

/**
 * Whether a tab is the one on show in its window (the page itself says,
 * which also covers a window of its own).
 */
async function isOnShow({ cdp, target_id }: { cdp: CdpConnection; target_id: string }) {
    let session_id: string | undefined;

    try {
        ({ sessionId: session_id } = await cdp.send({
            method: "Target.attachToTarget",
            params: { targetId: target_id, flatten: true },
        }));

        const { result } = await cdp.send({
            method: "Runtime.evaluate",
            params: { expression: "document.visibilityState", returnByValue: true },
            session_id,
        });

        return result?.value == "visible";
    } catch {
        return false;
    } finally {
        if (session_id) await cdp.send({ method: "Target.detachFromTarget", params: { sessionId: session_id } }).catch(() => {});
    }
}
