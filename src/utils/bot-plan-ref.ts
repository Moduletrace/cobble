/**
 * The inline ref a bot writes to show a plan it wrote: `/bot_plans`
 * renders it as the plan's card (its steps, and the buttons to approve or
 * change them before the bot begins).
 */
export default function botPlanRef({ plan_id }: { plan_id: number | string }) {
    return `[plan:${Number(plan_id)}]`;
}

/**
 * The href a rendered plan ref links to, so the card can read its id back
 * (`botPlanRefId`).
 */
export const BotPlanRefHrefPrefix = "#plan-";

/**
 * The plan id an href points at, or null for any other link.
 */
export function botPlanRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(BotPlanRefHrefPrefix)) return null;

    const plan_id = Number(href.slice(BotPlanRefHrefPrefix.length));

    if (!Number.isInteger(plan_id) || plan_id <= 0) return null;

    return plan_id;
}

/**
 * The plan id in a message's text (`botPlanRef`), or null when it names
 * none: how a run knows which plan its reply belongs to, so the chip under
 * it opens that plan.
 */
export function botPlanRefIdFromText({ text }: { text?: string | null }) {
    const plan_id = Number(/\[plan:(\d+)\]/.exec(text || "")?.[1] || 0);

    if (!Number.isInteger(plan_id) || plan_id <= 0) return null;

    return plan_id;
}