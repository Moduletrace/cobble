type Params = {
    /** The clipboard's `text/html`. */
    html: string;
    /** The clipboard's `text/plain`. */
    text: string;
};

/**
 * Whether a paste is replayed as plain text instead of parsed as HTML: a
 * rich paste from another site drops its styling (its markup and CSS),
 * while our own copies (`data-pm-slice`) keep their formatting and a paste
 * with no text (files, an image) is none of this handler's business.
 */
export default function shouldPastePlainText({ html, text }: Params) {
    if (!text) return false;
    if (!html) return false;

    return !html.includes("data-pm-slice");
}
