/**
 * Why an answer stops inside a structure the model meant to finish, or
 * null when the text can stand as a reply. The check is structural: a
 * table row with no close, a fence left open, a heading or list marker
 * with nothing under it. It never decides that a follow-up was owed.
 * That is the model's call (`suggest_next_steps`), and reading it out of
 * prose is what `send_reply` exists to stop.
 */
export default function unfinishedAnswerText({ text }: { text: string }): string | null {
    const trimmed = text.trim();

    if (!trimmed) return null;

    if (openFence({ text: trimmed })) {
        return "The message stops inside a code fence that was never closed. Finish the fence, or take it out, and send the whole message again.";
    }

    const last = lastContentLine({ text: trimmed });

    if (openTableRow({ line: last })) {
        return "The message stops in the middle of a markdown table row. Finish that row and the table, or take the unfinished row out, and send the whole message again.";
    }

    if (bareMarker({ line: last })) {
        return "The message stops on a heading or a list marker with nothing under it. Finish that part, or take the marker out, and send the whole message again.";
    }

    return null;
}

/**
 * A fence is open when an odd number of fence lines remain. A fence line
 * is ``` or ~~~ with nothing but an optional language tag after it, so a
 * row of dashes in a table is not one.
 */
function openFence({ text }: { text: string }) {
    let open = false;

    for (const line of text.split("\n")) {
        if (/^ {0,3}(`{3,}|~{3,})[^`~]*$/.test(line.trimEnd())) open = !open;
    }

    return open;
}

/**
 * The last line that holds something. Trailing blank lines are how a
 * model ends a paragraph, not how it ends a table.
 */
function lastContentLine({ text }: { text: string }) {
    const lines = text.split("\n");

    for (let index = lines.length - 1; index >= 0; index--) {
        const line = lines[index]!.trim();

        if (line) return line;
    }

    return "";
}

/**
 * A table row that opened and never closed: `| **revops** |` with the
 * rest of the cell on no line at all, or a row whose last cell is still
 * being written (`| **revops** | Lead routing`). A finished row ends with
 * `|`. A separator (`|---|---|`) is finished too. A line that merely
 * mentions a pipe in prose is left alone.
 */
function openTableRow({ line }: { line: string }) {
    if (!line.startsWith("|")) return false;
    if (line.endsWith("|")) return false;
    if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)) return false;

    return (line.match(/\|/g) || []).length >= 1;
}

/**
 * A heading, or a list marker, whose line holds nothing else. A heading
 * with its text, and a list item with its text, are finished lines.
 */
function bareMarker({ line }: { line: string }) {
    return /^#{1,6}$/.test(line) || /^[-*+]$/.test(line) || /^\d{1,3}[.)]$/.test(line);
}
