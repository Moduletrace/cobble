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

    const note_for = (left_out: number) => `\n\n[... ${left_out} characters left out ...]\n\n`;
    /**
     * The note reports what was actually cut (the text minus the two ends
     * kept), and its own length fills part of the cap, so the count and the
     * room settle together (L5). Sized so the note can't push the result
     * past `max_chars` (the harness cuts there too, and would cut the end
     * this keeps).
     */
    let left_out = text.length - max_chars;
    let note = note_for(left_out);
    let room = Math.max(0, max_chars - note.length);

    for (let i = 0; i < 4 && room > 0; i++) {
        const next_left = text.length - room;
        const next_note = note_for(next_left);
        const next_room = Math.max(0, max_chars - next_note.length);

        if (next_left === left_out && next_room === room) break;

        left_out = next_left;
        note = next_note;
        room = next_room;
    }

    /**
     * No room for any text when the cap is smaller than the note: return
     * the note alone, never `text.slice(-0)`, which is the whole text (L7).
     */
    if (room === 0) return note_for(text.length);

    const head = Math.floor(room * 0.4);
    const tail = room - head;

    return `${text.slice(0, head)}${note}${text.slice(-tail)}`;
}
