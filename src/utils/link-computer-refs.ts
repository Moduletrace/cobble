import { GraphicRefHrefPrefix } from "./graphic-ref";

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
 * The link target a folder ref (`folderRef`) becomes, e.g.
 * `#folder-computer%3A3%3Aseo%2Fraw`. The chat renders it as a chip that
 * opens that folder in the files browser.
 */
export const FolderRefHrefPrefix = "#folder-";

/**
 * The link target a proposal ref (`proposalRef`) becomes, e.g.
 * `#proposal-7`. The chat renders it as a chip that opens the card where
 * the super admin confirms or rejects the MCP server or tool.
 */
export const ProposalRefHrefPrefix = "#proposal-";

/**
 * The link target a hook proposal ref (`hookProposalRef`) becomes, e.g.
 * `#hook-proposal-4`. The chat renders it as a chip that opens the card
 * where the user confirms or rejects the hook.
 */
export const HookProposalRefHrefPrefix = "#hook-proposal-";

/**
 * The link target a secret ref (`secretRef`) becomes, e.g. `#secret-ref-12`.
 * The chat renders it as a masked chip with Reveal and Copy.
 */
export const SecretRefHrefPrefix = "#secret-ref-";

/**
 * The link target a secret request ref (`secretRequestRef`) becomes, e.g.
 * `#secret-request-4`. The chat renders it as a chip that opens the card
 * the user types the secret into.
 */
export const SecretRequestRefHrefPrefix = "#secret-request-";

/**
 * Turns every computer ref (`[computer:3]`) and take-over ref
 * (`[take-over:3:browser]`), bot ref (`[bot:3]`), workspace ref
 * (`[workspace:2]`), file ref (`[file:12]`), folder ref
 * (`[folder:computer:3:seo/raw]`), proposal ref (`[proposal:7]`) and hook
 * proposal ref (`[hook-proposal:4]`), secret ref (`[secret:12]`) and secret
 * request ref (`[secret-request:4]`) and graphic ref (`[graphic:5]`) in a
 * message into a markdown link, so it
 * survives markdown rendering as a link the chat can swap for a button,
 * chip or download.
 *
 * A file ref and a folder ref are different things and are never guessed
 * from a name: `[file:12]` is a saved file (its chip downloads it),
 * `[folder:...]` a folder (its chip opens the files browser there).
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
        .replace(
            /\[proposal:(\d+)\](?!\()/g,
            (_, id: string) => `[proposal ${id}](${ProposalRefHrefPrefix}${id})`,
        )
        .replace(
            /\[hook-proposal:(\d+)\](?!\()/g,
            (_, id: string) => `[hook proposal ${id}](${HookProposalRefHrefPrefix}${id})`,
        )
        .replace(/\[secret:(\d+)\](?!\()/g, (_, id: string) => `[secret ${id}](${SecretRefHrefPrefix}${id})`)
        .replace(
            /\[secret-request:(\d+)\](?!\()/g,
            (_, id: string) => `[secret request ${id}](${SecretRequestRefHrefPrefix}${id})`,
        )
        .replace(/\[graphic:(\d+)\](?!\()/g, (_, id: string) => `[graphic ${id}](${GraphicRefHrefPrefix}${id})`)
        .replace(/\[file:(\d+)\](?!\()/g, (_, id: string) => `[file ${id}](${FileRefHrefPrefix}${id})`)
        .replace(/\[folder:([a-z]+):(\d+):([^\]\n]+)\](?!\()/g, (_, volume: string, owner: string, path: string) =>
            `[${path}](${FolderRefHrefPrefix}${encodeURIComponent(`${volume}:${owner}:${path}`)})`,
        )
        .replace(/\[folder:([a-z]+):(\d+)\](?!\()/g, (_, volume: string, owner: string) =>
            `[${volume} ${owner}](${FolderRefHrefPrefix}${encodeURIComponent(`${volume}:${owner}`)})`,
        );
}
