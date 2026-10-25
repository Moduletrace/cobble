type Params = {
    id: number | string;
};

/**
 * How a bot names a secret it asked the user for: `[secret-request:4]`.
 * The chat shows it as a chip that opens the card the user types it
 * into, so it never goes through the chat or the model.
 */
export default function secretRequestRef({ id }: Params) {
    return `[secret-request:${id}]`;
}
