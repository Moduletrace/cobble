type Params = {
    text: string;
};

/**
 * Copies text to the clipboard and says whether it worked. The async
 * clipboard API needs a secure context, so a plain HTTP address (a VPN or
 * LAN install) falls back to copying from a temporary textarea.
 */
export default async function copyText({ text }: Params): Promise<boolean> {
    if (!text) {
        return false;
    }

    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to the textarea, which can still work.
        }
    }

    return copyWithTextarea({ text });
}

/**
 * The pre-clipboard-API way: select a hidden textarea and copy it. The
 * element is off screen rather than hidden, since `display: none` is not
 * selectable, and it is removed again either way.
 */
function copyWithTextarea({ text }: Params): boolean {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.className = "sr-only";

    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand("copy");
    } catch {
        return false;
    } finally {
        textarea.remove();
    }
}
