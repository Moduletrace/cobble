/**
 * How a bot names a crew member in a message: `[bot:3]`. The chat shows it
 * as a link to that bot's conversation.
 */
export default function botRef({ id }: { id: number | string }) {
    return `[bot:${id}]`;
}
