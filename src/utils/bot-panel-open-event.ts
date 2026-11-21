export const BotPanelOpenEvent = "cobble:open-bot-panel";

type Params = {
    target?: EventTarget | null;
};

/**
 * Asks the page to slide its bot panel in, the way the avatar beside the
 * conversation's name does: a swipe from the right on a phone. The layout
 * sends it from outside the conversation, so a page without one (a
 * graphic's own page, settings) simply has nobody listening.
 */
export default function requestBotPanel({
    target = typeof window == "undefined" ? null : window,
}: Params = {}) {
    target?.dispatchEvent(new Event(BotPanelOpenEvent));
}