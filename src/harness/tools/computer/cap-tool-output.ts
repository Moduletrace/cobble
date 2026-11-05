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

    const head = Math.floor(max_chars * 0.4);
    const tail = max_chars - head;

    return `${text.slice(0, head)}\n\n[... ${text.length - max_chars} characters left out ...]\n\n${text.slice(-tail)}`;
}
