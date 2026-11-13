import type { LiveCrewRefreshedDetail } from "@/src/types";

export const LiveCrewRefreshedEvent = "cobble:live-crew-refreshed";

/**
 * Tells the page's lists (the rail's bots and workspaces) the crew as it
 * stands now, once it has been read again.
 */
export default function announceLiveCrew(detail: LiveCrewRefreshedDetail) {
    window.dispatchEvent(new CustomEvent(LiveCrewRefreshedEvent, { detail }));
}