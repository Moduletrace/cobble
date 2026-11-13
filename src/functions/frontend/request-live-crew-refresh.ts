export const LiveCrewRefreshRequestedEvent = "cobble:refresh-live-crew";

/**
 * Asks the layout to read the crew again, for an action that wants the
 * whole page current (the thread's pull-to-reload) rather than each list
 * fetching its own copy.
 */
export default function requestLiveCrewRefresh() {
    window.dispatchEvent(new Event(LiveCrewRefreshRequestedEvent));
}