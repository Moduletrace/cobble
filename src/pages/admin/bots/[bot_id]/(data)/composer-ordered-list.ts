import type { MarkdownTokenizer } from "@tiptap/core";
import OrderedList from "@tiptap/extension-ordered-list";

/**
 * The one way markdown starts an ordered list here: digits, as every
 * renderer in the app reads it (react-markdown/remark). Tiptap's own
 * tokenizer also takes `a.` and `i.`, so a recalled message such as
 * "Ok. Do another pass on the browser." came back as a list item
 * numbered 401 with "Ok." swallowed as the marker.
 */
const DigitMarker = /^ {0,3}\d{1,9}[.)][\t ]/;

const TiptapTokenizer = OrderedList.config.markdownTokenizer as MarkdownTokenizer;

const ComposerOrderedList = OrderedList.extend({
    markdownTokenizer: {
        ...TiptapTokenizer,
        tokenize: (src, tokens, lexer) => {
            if (!DigitMarker.test(src)) return undefined;

            return TiptapTokenizer.tokenize(src, tokens, lexer);
        },
    },
});

export default ComposerOrderedList;
