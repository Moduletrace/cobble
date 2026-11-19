type Params = {
    text: string;
};

/**
 * What a reply asserted about the app's own state that nothing it called
 * told it:
 *
 * - `routing`: how the app picks or routes the model. The pick is a setting
 *   the run never reads, so the explanation is made up. Production, Nov
 *   2026: an image call failed with "HTTP 404" and the bot answered "That's
 *   what the OpenRouter routing is resolving to", naming a model and a
 *   provider nobody had configured.
 * - `stopped_run`: a run claimed as killed or stopped. A run can't stop
 *   itself; Stop in the thread is the user's button, and that same reply
 *   said "Killed the run" while its job had simply completed.
 * - `rest`: the model rest described as unlimited or as needing a restart.
 *   The app's message says when the next try is possible (or that the rest
 *   lasts until the run limits change), never the wording faulted here.
 */
export type AppStateClaim = "routing" | "stopped_run" | "rest";

/**
 * The tools whose answer carries the app's own account of a model or a run,
 * so a reply that called one may be repeating it rather than inventing it.
 * Every name here must be one the harness registers
 * (`tool-name-lists.test.ts`).
 */
export const AppStateTools = ["read_message_usage", "read_settings"];

/**
 * Markdown emphasis inside a claim ("the **OpenRouter routing** is
 * resolving") would otherwise split the phrase every pattern reads.
 */
function plainText({ text }: Params) {
    return text.replace(/[*_`]/g, "");
}

const RoutingPatterns = [
    /\brouting\s+(?:is|was)\s+(?:resolving|resolves|mapping|maps|sending|sends|pointing|points)\b/i,
    /\b(?:model|provider)\s+parameter\s+(?:is|gets|was|has been)\s+(?:sent|set|passed|resolved)\b/i,
    /\bis\s+being\s+routed\s+(?:to|through|via)\b/i,
    /\bwhich\s+model\s+(?:the\s+)?(?:tool|harness|workspace|bot|app)\s+(?:is\s+)?(?:set to|using|picks)\b/i,
];

const RunStoppedPatterns = [
    /(?:^|[.!?\n]\s*)(?:i\s+)?(?:just\s+|already\s+)?(?:killed|stopped|cancelled|canceled|halted)\s+(?:the|that|this)\s+(?:run|job|task)\b/i,
    /\bi\s+(?:just\s+|already\s+)?(?:killed|stopped|cancelled|canceled|halted)\s+(?:it|the run|the job|the task)\b/i,
    /\bthe\s+(?:run|job|task)\s+(?:is|was|has been)\s+(?:killed|stopped|cancelled|canceled|halted)\b/i,
];

/**
 * Only the wording the app never uses: the real message for a rest with no
 * end says "stay benched until the run limits change or the app restarts",
 * and a bot repeating it is quoting the app, not inventing.
 */
const RestPatterns = [
    /\bunlimited\s+(?:rest|rest-after-failure|cooldown)\b/i,
    /\brest-after-failure\s+setting\b/i,
    /\b(?:super.?admin|app restart|restarting the app)\b[^.\n]{0,40}\b(?:so|to)\s+(?:the\s+)?models?\s+(?:recover|come back)\b/i,
];

/**
 * The app-state claims a reply makes, by kind, without repeats. Empty when
 * it stays with what its tools returned.
 */
export default function replyAppStateClaims({ text }: Params): AppStateClaim[] {
    const plain = plainText({ text });
    const claims: AppStateClaim[] = [];

    if (RoutingPatterns.some((pattern) => pattern.test(plain))) claims.push("routing");
    if (RunStoppedPatterns.some((pattern) => pattern.test(plain))) claims.push("stopped_run");
    if (RestPatterns.some((pattern) => pattern.test(plain))) claims.push("rest");

    return claims;
}