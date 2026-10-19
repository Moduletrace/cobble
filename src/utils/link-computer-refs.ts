/**
 * The link target a computer ref (`computerRef`) becomes, e.g.
 * `#computer-3`. The chat's markdown renders these links as buttons that
 * switch the bot to that computer.
 */
export const ComputerRefHrefPrefix = "#computer-";

/**
 * Turns every computer ref in a message into a markdown link to
 * `#computer-<id>`, so it survives markdown rendering as a link the chat
 * can swap for a switch button.
 */
export default function linkComputerRefs({ text }: { text: string }) {
    return text.replace(
        /\[computer:(\d+)\](?!\()/g,
        (_, id: string) => `[computer ${id}](${ComputerRefHrefPrefix}${id})`,
    );
}
