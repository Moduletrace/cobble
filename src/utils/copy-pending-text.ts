import copyText from "./copy-text";

type Params = {
    /**
     * The text, still on its way (e.g. from a fetch).
     */
    text: Promise<string>;
};

/**
 * Copies text that is still loading and says whether it worked. Safari
 * only lets a click write to the clipboard while it is still handling
 * the click, so the write starts at once with a `ClipboardItem` that
 * waits for the text. Where that isn't supported it waits and falls back
 * to `copyText`. Throws when `text` does.
 */
export default async function copyPendingText({ text }: Params): Promise<boolean> {
    if (typeof ClipboardItem != "undefined" && navigator.clipboard?.write) {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    "text/plain": text.then((value) => new Blob([value], { type: "text/plain" })),
                }),
            ]);

            return true;
        } catch {
            // Fall through: `text` failing rethrows below.
        }
    }

    return copyText({ text: await text });
}
