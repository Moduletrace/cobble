/**
 * Text as one shell word, so a name with spaces or quotes is still one
 * argument.
 */
export default function shellQuote({ text }: { text: string }) {
    return `'${text.split("'").join(`'\\''`)}'`;
}
