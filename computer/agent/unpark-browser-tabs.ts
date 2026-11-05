import type { CdpConnection } from "./open-cdp-connection";
import type { ParkedTab } from "./park-browser-tabs";

/**
 * Puts parked sites back in front and closes the blank tabs that covered
 * them, last parked first, so the browser is as it was left. A tab that
 * went away meanwhile is skipped.
 */
export default async function unparkBrowserTabs({ cdp, parked }: { cdp: CdpConnection; parked: ParkedTab[] }) {
    for (const { page_id, blank_id } of [...parked].reverse()) {
        await cdp.send({ method: "Target.activateTarget", params: { targetId: page_id } }).catch(() => {});
        await cdp.send({ method: "Target.closeTarget", params: { targetId: blank_id } }).catch(() => {});
    }
}
