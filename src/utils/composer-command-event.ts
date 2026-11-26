export const ComposerCommandEvent = "cobble:composer-command";

/**
 * Asks the page to do what a composer command names (open one of the header
 * menu's modals): the composer sends it, and the mounted component listening
 * for its own name answers. Like the bot panel's open event, a page without
 * a listener simply ignores it.
 */
export default function dispatchComposerCommand({ name }: { name: string }) {
    if (typeof window == "undefined") return;

    window.dispatchEvent(
        new CustomEvent(ComposerCommandEvent, { detail: name }),
    );
}
