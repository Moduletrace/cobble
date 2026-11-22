/**
 * Composio's hosted MCP router cuts a large tool result down to a preview:
 * `data` becomes `data_preview`, holding a couple of the items, a
 * "...N more items" marker and instructions to parse a "saved response"
 * that a programmatic client never gets, plus `structure_info`, `next_steps`
 * and a `log_id`. Read as the whole answer it looks like an empty inbox (a
 * Gmail fetch of 10 messages came back as 2, and a bot reported that the
 * account had only those two), so a run that got a preview is told what it
 * actually holds instead (ComposioHQ/composio#5025).
 */

export type PreviewResult = { preview: false } | { preview: true; text: string };

const MoreItems = /^\.\.\.(\d+) more items$/;

type Elision = {
    /** Items the provider kept. */
    shown: number;
    /** Items the provider cut. */
    left_out: number;
};

/**
 * The biggest cut in the tree: the array the provider truncated most (the
 * messages of a fetch, not the few label ids elided on each one).
 */
function largestElision({ value }: { value: unknown }): Elision {
    let largest: Elision = { shown: 0, left_out: 0 };

    const visit = (node: unknown) => {
        if (Array.isArray(node)) {
            let shown = 0;
            let left_out = 0;

            for (const item of node) {
                const match = typeof item == "string" ? MoreItems.exec(item) : null;

                if (match) left_out += Number(match[1]);
                else if (item != null) shown += 1;
            }

            if (left_out > largest.left_out) largest = { shown, left_out };

            for (const item of node) visit(item);

            return;
        }

        if (node && typeof node == "object") {
            for (const item of Object.values(node as Record<string, unknown>)) visit(item);
        }
    };

    visit(value);

    return largest;
}

/**
 * Every `data_preview` the tree carries. The preview itself is not walked:
 * only the key names it as cut.
 */
function collectPreviews({ value }: { value: unknown }): unknown[] {
    const previews: unknown[] = [];

    const visit = (node: unknown) => {
        if (Array.isArray(node)) {
            for (const item of node) visit(item);

            return;
        }

        if (!node || typeof node != "object") return;

        for (const [key, item] of Object.entries(node as Record<string, unknown>)) {
            if (key == "data_preview") previews.push(item);
            else visit(item);
        }
    };

    visit(value);

    return previews;
}

function previewNote({ previews }: { previews: unknown[] }): string {
    const { shown, left_out } = largestElision({ value: previews });

    const count = left_out
        ? `${shown} of ${shown + left_out} items are here and the other ${left_out} were cut before they reached you`
        : "only part of it is here";

    return [
        `The provider returned a preview, not the whole result: ${count}.`,
        "This is a truncated sample, never the total and never an empty result: ask again for a smaller page (fewer results, no message payload, or ids only) to see the rest.",
    ].join(" ");
}

/**
 * The text a run should see in place of the provider's answer: the preview
 * rewritten to say how much of the result is missing, or `preview: false`
 * when the answer is the whole one.
 *
 * `structure_info`, `next_steps` and `log_id` are dropped with the envelope:
 * they describe the preview, and `next_steps` sends a run looking for a file
 * the app never receives.
 */
export default function previewResult({ text }: { text: string }): PreviewResult {
    let parsed: unknown;

    try {
        parsed = JSON.parse(text);
    } catch {
        return { preview: false };
    }

    const previews = collectPreviews({ value: parsed });

    if (!previews.length) return { preview: false };

    return {
        preview: true,
        text: [previewNote({ previews }), ...previews.map((preview) => JSON.stringify(preview, null, 2))].join("\n\n"),
    };
}