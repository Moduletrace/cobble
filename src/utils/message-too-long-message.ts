type Params = {
    /**
     * The message's length in characters, as sent (trimmed markdown).
     */
    length: number;
    max_chars: number;
};

/**
 * What the composer and the send route say when a message is over the
 * install's limit: the limit and how far over it is, since formatting and
 * mentions count and the user can't see that from the text alone.
 */
export default function messageTooLongMessage({ length, max_chars }: Params) {
    const over = Math.max(1, length - max_chars);

    return `Messages can be up to ${max_chars.toLocaleString("en")} characters, and this one is ${over.toLocaleString("en")} over (formatting and mentions count). Shorten it, or attach the text as a file.`;
}
