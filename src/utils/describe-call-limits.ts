import type { HarnessCallLimits } from "@/src/harness/usage/types";
import { isUnlimitedLimit, type RunLimit } from "./run-limit";

const count = (value: number) => value.toLocaleString("en-US");

/**
 * One limit as a reader sees it: the number, "unlimited", or null for a
 * limit no call recorded (not the same as no limit at all).
 */
const part = ({ value, unit }: { value: RunLimit | null; unit: string }) => {
    if (value === null) return null;
    if (isUnlimitedLimit(value)) return `unlimited ${unit}`;

    return `${count(value)} ${unit}`;
};

/**
 * The limits a run worked under, as one line for a call's details: the
 * steps it had, the prompt tokens it could spend in all and the working
 * context it sent per turn.
 */
export default function describeCallLimits({ limits }: { limits: HarnessCallLimits }) {
    const parts = [
        part({ value: limits.steps, unit: "steps" }),
        part({ value: limits.run_tokens, unit: "prompt tokens" }),
        part({ value: limits.context_tokens, unit: "of context per turn" }),
    ].filter((value): value is string => Boolean(value));

    return parts.length ? parts.join(", ") : "not recorded";
}