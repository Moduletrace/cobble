/**
 * Where a sideways drag belongs to the control instead of the page: typing,
 * selecting a field's text or moving its caret all live here.
 */
export const FieldTouchTargets =
    "input, textarea, select, [contenteditable='true'], .cm-editor";

type Params = {
    target: EventTarget | null;
};

/**
 * Whether a touch landed on a field, which owns it: a swipe read there would
 * take a caret or a selection, not a pane.
 */
export default function touchInField({ target }: Params): boolean {
    if (!(target instanceof Element)) return false;

    return Boolean(target.closest(FieldTouchTargets));
}