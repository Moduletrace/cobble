type Params = {
    /**
     * What a browser tool returned, usually a Playwright aria snapshot.
     */
    text: string;
};

/**
 * Names a password field goes by: the app's own, a form's label, or a hint
 * its placeholder gives. Anything else is left as it is.
 */
const PasswordNamePattern =
    /password|passwd|pass[-_ ]?phrase|\bpin\b|\botp\b|one[-_ ]?time|secret|token|api[-_ ]?key|\b2fa\b|\bmfa\b/i;

/**
 * `- textbox "Name" [ref=...]: value`, and the searchbox the same.
 */
const FieldPattern = /^(\s*)-\s+(textbox|searchbox)\s+"((?:[^"\\]|\\.)*)"(.*)$/;

/**
 * A `- text: value` nested under a field, which is how a textarea's value
 * comes through.
 */
const TextLinePattern = /^\s*-\s+text:\s*(.*)$/;

/**
 * `- cell "Label" [ref=...]:` and the other roles: the first quoted string
 * is the element's accessible name.
 */
const LabelPattern = /^(\s*-\s+[a-z_]+\s+")((?:[^"\\]|\\.)*)(")/;

const Mask = "[hidden]";
const Masks = [Mask, "[redacted]"];

/**
 * A short value is too easy to match by accident in a label that has
 * nothing to do with it.
 */
const MinScrubLength = 4;

/**
 * Blanks the values of password fields out of what a browser tool returns,
 * and out of the label of every element around them.
 *
 * A page's own markup can put a field's value into its container's text, and
 * the aria snapshot reports an accessible name alongside a field's value: a
 * login form Chrome had filled showed the saved password twice, once as the
 * field's value and once inside its cell's label, so masking only the field
 * line left it on show (a real run read it and put it in a message). This
 * covers both, and only for fields whose name says what they hold: nothing
 * else in a page's text is touched.
 *
 * It can't cover a page that prints its own password somewhere unrelated, a
 * bot that reads `input.value` with browser_evaluate, or a value the model
 * sees on a screenshot. It is a barrier at the tool, not a guarantee.
 */
export default function maskPasswordFieldValues({ text }: Params): string {
    const lines = text.split("\n");
    /**
     * Indexes of the lines that are ancestors of the line being read.
     */
    const ancestors: number[] = [];

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index]!;

        while (ancestors.length && indentOf({ line: lines[ancestors[ancestors.length - 1]!]! }) >= indentOf({ line })) {
            ancestors.pop();
        }

        const field = FieldPattern.exec(line);

        if (field && PasswordNamePattern.test(field[3]!)) {
            const value = valueOf(field[4] || "");

            if (value) {
                lines[index] = maskInline({ line, value });
                scrub({ lines, ancestors, value });
            } else {
                /**
                 * A textarea's value comes on a `- text:` line under it, past
                 * the placeholder and hint lines a field can also carry.
                 */
                const field_indent = indentOf({ line });

                for (let next = index + 1; next < lines.length; next++) {
                    const candidate = lines[next]!;

                    if (indentOf({ line: candidate }) <= field_indent) break;

                    const text_line = TextLinePattern.exec(candidate);

                    if (!text_line) continue;

                    const text_value = text_line[1]!.trim();

                    if (!text_value || Masks.includes(text_value)) break;

                    const at = candidate.lastIndexOf(text_value);

                    lines[next] = `${candidate.slice(0, at)}${Mask}${candidate.slice(at + text_value.length)}`;
                    scrub({ lines, ancestors, value: text_value });
                    break;
                }
            }
        }

        if (line.trimStart().startsWith("- ")) ancestors.push(index);
    }

    return lines.join("\n");
}

function indentOf({ line }: { line: string }) {
    return line.length - line.trimStart().length;
}

function valueOf(rest: string) {
    const inline = /:\s*(.+)$/.exec(rest)?.[1]?.trim() || "";

    return Masks.includes(inline) ? "" : inline;
}

function maskInline({ line, value }: { line: string; value: string }) {
    const at = line.lastIndexOf(value);

    if (at < 0) return line;

    return `${line.slice(0, at)}${Mask}${line.slice(at + value.length)}`;
}

/**
 * Replaces the value inside the quoted accessible name of each ancestor,
 * which is where a filled-in field's value leaked a second time.
 */
function scrub({ lines, ancestors, value }: { lines: string[]; ancestors: number[]; value: string }) {
    if (value.length < MinScrubLength) return;

    for (const index of ancestors) {
        const line = lines[index]!;
        const label = LabelPattern.exec(line);

        if (!label || !label[2]!.includes(value)) continue;

        lines[index] = `${label[1]}${label[2]!.split(value).join(Mask)}${label[3]}${line.slice(label[0].length)}`;
    }
}