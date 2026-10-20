/**
 * A bot message as one line of plain text, for the rail's preview: no
 * markdown syntax, links as their text, computer refs (`computerRef`) as
 * "a computer", bot refs (`botRef`) as "a bot", whitespace collapsed.
 */
export default function messagePreview({ text }: { text: string }) {
    return text
        .replace(/```[^\n]*\n?/g, "")
        .replace(/\[computer:\d+\](?!\()/g, "a computer")
        .replace(/\[bot:\d+\](?!\()/g, "a bot")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+)/gm, "")
        .replace(/(\*\*|__|~~|`)/g, "")
        .replace(/(^|\s)[*_](\S[^*_]*\S|\S)[*_](?=\s|$|[.,;:!?])/g, "$1$2")
        .replace(/\|/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
