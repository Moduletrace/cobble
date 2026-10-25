type Params = {
    id: number | string;
};

/**
 * How a bot names an MCP server or tool it proposed in a message:
 * `[proposal:7]`. The chat shows it as a chip that opens the confirm card.
 */
export default function proposalRef({ id }: Params) {
    return `[proposal:${id}]`;
}
