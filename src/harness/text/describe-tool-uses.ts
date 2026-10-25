import type { HarnessToolUse } from "../types";

type Params = {
    uses: HarnessToolUse[];
};

/**
 * A run's tool calls in one line, grouped by tool in the order first
 * called: `update_memory, fetch_url x3 (1 failed)`, or `none`. The app's
 * own record of what happened, told to the model so it can't report work
 * it never did.
 */
export default function describeToolUses({ uses }: Params) {
    const counts = new Map<string, { calls: number; failed: number }>();

    for (const use of uses) {
        const count = counts.get(use.name) || { calls: 0, failed: 0 };

        count.calls++;
        if (!use.ok) count.failed++;
        counts.set(use.name, count);
    }

    if (!counts.size) return "none";

    return [...counts]
        .map(([name, { calls, failed }]) => {
            const times = calls > 1 ? ` x${calls}` : "";
            const failures = !failed ? "" : failed == calls ? " (failed)" : ` (${failed} failed)`;

            return `${name}${times}${failures}`;
        })
        .join(", ");
}
