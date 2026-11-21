/**
 * Whether a key press belongs to a field the user types in, whose own
 * meaning for it (End moving the caret to the line's end, Home back to its
 * start) must win over the page's shortcuts.
 */
const FieldTags = ["INPUT", "TEXTAREA", "SELECT"];

export default function typingInField({
    target,
}: {
    target: EventTarget | null;
}) {
    /**
     * Read by shape rather than `instanceof HTMLElement`: the check runs on
     * every key press, including ones a window or a document dispatches.
     */
    const field = target as Partial<HTMLElement> | null;

    if (!field || typeof field.tagName != "string") return false;
    if (field.isContentEditable) return true;

    return FieldTags.includes(field.tagName);
}