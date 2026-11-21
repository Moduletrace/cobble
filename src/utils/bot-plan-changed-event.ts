import type { BotPlanView } from "@/src/types";

export const BotPlanChangedEvent = "cobble:bot-plan-changed";

type Params = {
    plan: BotPlanView;
    target?: EventTarget | null;
};

/**
 * Tells the page that a plan changed, from the card that moved it. The app
 * also pushes `server:bot-plan`, but a push that never lands (a socket
 * between reconnects, a route handled away from the sockets' module
 * instance) must not leave the plan bar, and the thread's other cards of
 * the same plan, showing the status it had before the click.
 */
export default function announceBotPlanChanged({
    plan,
    target = typeof window == "undefined" ? null : window,
}: Params) {
    target?.dispatchEvent(new CustomEvent(BotPlanChangedEvent, { detail: { plan } }));
}