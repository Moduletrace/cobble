type Params = {
    text: string;
    max_chars: number;
};

/**
 * Text kept to `max_chars`: its start and its end, which is where a
 * command's answer and its error usually are, with what was left out
 * said in between.
 */
export default function capToolOutput({ text, max_chars }: Params) {
    if (text.length <= max_chars) return text;

    /**
     * Sized before the two ends are cut, so the note can't push the result
     * past `max_chars` (the harness cuts there too, and would cut the end
     * this keeps).
     */
    const note = `\n\n[... ${text.length - max_chars} characters left out ...]\n\n`;
    const room = Math.max(0, max_chars - note.length);
    const head = Math.floor(room * 0.4);
    const tail = room - head;

    return `${text.slice(0, head)}${note}${text.slice(-tail)}`;
}
