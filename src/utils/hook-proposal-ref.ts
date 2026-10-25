type Params = {
    id: number | string;
};

/**
 * How a bot names a hook it proposed in a message: `[hook-proposal:4]`.
 * The chat shows it as a chip that opens the card the user confirms it
 * from.
 */
export default function hookProposalRef({ id }: Params) {
    return `[hook-proposal:${id}]`;
}
