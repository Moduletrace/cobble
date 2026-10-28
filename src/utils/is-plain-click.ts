type Params = {
    event: {
        button: number;
        metaKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
    };
};

/**
 * A plain left click, with no key held: the one a link may take over (to
 * open a preview); a middle click or Ctrl/Cmd/Shift click still does what
 * the browser does with a link (a new tab or window).
 */
export default function isPlainClick({ event }: Params) {
    return event.button == 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
