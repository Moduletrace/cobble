/**
 * How a bot names one of its computers in a message: `[computer:3]`. The
 * chat shows it as a button that switches the bot to that computer.
 */
export default function computerRef({ id }: { id: number | string }) {
    return `[computer:${id}]`;
}
