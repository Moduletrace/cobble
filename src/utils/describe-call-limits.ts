import type { HarnessCallLimits } from "@/src/harness/usage/types";

const count = (value: number) => value.toLocaleString("en-US");

/**
 * The limits a run worked under, as one line for a call's details: the
 * steps it had, the prompt tokens it could spend in all and the working
 * context it sent per turn. `null` is a limit no call recorded, which is
 * not the same as no limit at all.
 */
export default function describeCallLimits({ limits }: { limits: HarnessCallLimits }) {
    const parts = [
        limits.steps === null ? null : `${count(limits.steps)} steps`,
        limits.run_tokens === null ? null : `${count(limits.run_tokens)} prompt tokens`,
        limits.context_tokens === null ? null : `${count(limits.context_tokens)} of context per turn`,
    ].filter((part): part is string => Boolean(part));

    return parts.length ? parts.join(", ") : "not recorded";
}