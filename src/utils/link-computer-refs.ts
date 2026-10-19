/**
 * The link target a computer ref (`computerRef`) becomes, e.g.
 * `#computer-3`. The chat's markdown renders these links as buttons that
 * switch the bot to that computer.
 */
export const ComputerRefHrefPrefix = "#computer-";

/**
 * The link target a take-over ref (`takeOverRef`) becomes, e.g.
 * `#take-over-3-browser`. The chat renders these as buttons that open the
 * computer in that mode.
 */
export const TakeOverRefHrefPrefix = "#take-over-";

/**
 * Turns every computer ref (`[computer:3]`) and take-over ref
 * (`[take-over:3:browser]`) in a message into a markdown link, so it
 * survives markdown rendering as a link the chat can swap for a button.
 */
export default function linkComputerRefs({ text }: { text: string }) {
    return text
        .replace(
            /\[computer:(\d+)\](?!\()/g,
            (_, id: string) => `[computer ${id}](${ComputerRefHrefPrefix}${id})`,
        )
        .replace(
            /\[take-over:(\d+):([a-z]+)\](?!\()/g,
            (_, id: string, mode: string) => `[take over](${TakeOverRefHrefPrefix}${id}-${mode})`,
        );
}
