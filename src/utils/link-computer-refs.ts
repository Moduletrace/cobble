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
 * The link target a bot ref (`botRef`) becomes, e.g. `#bot-3`. The chat
 * renders these as links to that bot's conversation.
 */
export const BotRefHrefPrefix = "#bot-";

/**
 * The link target a workspace ref (`workspaceRef`) becomes, e.g.
 * `#workspace-2`. The chat renders these as links to that workspace.
 */
export const WorkspaceRefHrefPrefix = "#workspace-";

/**
 * The link target a file ref (`fileRef`) becomes, e.g. `#file-12`. The
 * chat renders these as a chip that opens the file.
 */
export const FileRefHrefPrefix = "#file-";

/**
 * The link target a path ref (`pathRef`) becomes, e.g.
 * `#path-computer%3A3%3Aseo%2Fraw`. The chat renders it as a chip that
 * opens that folder in the files browser.
 */
export const PathRefHrefPrefix = "#path-";

/**
 * Turns every computer ref (`[computer:3]`) and take-over ref
 * (`[take-over:3:browser]`), bot ref (`[bot:3]`), workspace ref
 * (`[workspace:2]`), file ref (`[file:12]`) and path ref
 * (`[path:computer:3:seo/raw]`) in a message into a markdown link, so it
 * survives markdown rendering as a link the chat can swap for a button or
 * chip.
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
        )
        .replace(/\[bot:(\d+)\](?!\()/g, (_, id: string) => `[bot ${id}](${BotRefHrefPrefix}${id})`)
        .replace(
            /\[workspace:(\d+)\](?!\()/g,
            (_, id: string) => `[workspace ${id}](${WorkspaceRefHrefPrefix}${id})`,
        )
        .replace(/\[file:(\d+)\](?!\()/g, (_, id: string) => `[file ${id}](${FileRefHrefPrefix}${id})`)
        .replace(/\[path:([a-z]+):(\d+):([^\]\n]+)\](?!\()/g, (_, volume: string, owner: string, path: string) =>
            `[${path}](${PathRefHrefPrefix}${encodeURIComponent(`${volume}:${owner}:${path}`)})`,
        )
        .replace(/\[path:([a-z]+):(\d+)\](?!\()/g, (_, volume: string, owner: string) =>
            `[${volume} ${owner}](${PathRefHrefPrefix}${encodeURIComponent(`${volume}:${owner}`)})`,
        );
}
