type Params = {
    text: string;
    /**
     * The take-over refs the bot asked for in this run (`askToTakeOverTool`),
     * and the proposals it made for the user to confirm (`proposalRef`).
     */
    refs: string[];
};

/**
 * A job's message with every take-over the bot asked for in it and every
 * proposal it made: refs the bot didn't write itself are added at the
 * end, so the user always gets the button. A message asking for either
 * needs the user.
 */
export default function withTakeOverRefs({ text, refs }: Params) {
    const missing = [...new Set(refs)].filter((ref) => !text.includes(ref));

    return {
        result: [text.trim(), ...missing].filter(Boolean).join("\n\n"),
        needs_you: refs.length > 0,
    };
}
