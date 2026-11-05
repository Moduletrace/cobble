type Params = {
    text: string;
    old_text: string;
    new_text: string;
    replace_all: boolean;
};

/**
 * `old_text` replaced in `text`: where it's found exactly once, or
 * everywhere with `replace_all`. Not ok, with how often it was found,
 * otherwise.
 */
export default function replaceInText({ text, old_text, new_text, replace_all }: Params) {
    const count = text.split(old_text).length - 1;

    if (count == 0 || (count > 1 && !replace_all)) return { ok: false as const, count };

    return { ok: true as const, count, text: text.split(old_text).join(new_text) };
}
