import { ChatroomRefHrefPrefix } from "./chatroom-ref";
import { GraphicRefHrefPrefix } from "./graphic-ref";
import {
    BotRefHrefPrefix,
    ComputerRefHrefPrefix,
    FileRefHrefPrefix,
    FolderRefHrefPrefix,
    HookProposalRefHrefPrefix,
    ProposalRefHrefPrefix,
    SecretRefHrefPrefix,
    SecretRequestRefHrefPrefix,
    TakeOverRefHrefPrefix,
    WorkspaceRefHrefPrefix,
} from "./link-computer-refs";

/**
 * Turns every computer ref (`[computer:3]`) and take-over ref
 * (`[take-over:3:browser]`), bot ref (`[bot:3]`), workspace ref
 * (`[workspace:2]`), file ref (`[file:12]`), folder ref
 * (`[folder:computer:3:seo/raw]`), proposal ref (`[proposal:7]`) and hook
 * proposal ref (`[hook-proposal:4]`), secret ref (`[secret:12]`) and secret
 * request ref (`[secret-request:4]`), graphic ref (`[graphic:5]`) and
 * chatroom ref (`[room:<id>]`) in a
 * stretch of message text (never code) into a markdown link, so it
 * survives markdown rendering as a link the chat can swap for a button,
 * chip or download.
 *
 * A file ref and a folder ref are different things and are never guessed
 * from a name: `[file:12]` is a saved file (its chip downloads it),
 * `[folder:...]` a folder (its chip opens the files browser there).
 */
export default function linkRefsInText({ text }: { text: string }) {
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
        .replace(/\[room:(\d+)\](?!\()/g, (_, id: string) => `[room ${id}](${ChatroomRefHrefPrefix}${id})`)
        .replace(/\[file:(\d+)\](?!\()/g, (_, id: string) => `[file ${id}](${FileRefHrefPrefix}${id})`)
        .replace(/\[folder:([a-z]+):(\d+):([^\]\n]+)\](?!\()/g, (_, volume: string, owner: string, path: string) =>
            `[${path}](${FolderRefHrefPrefix}${encodeURIComponent(`${volume}:${owner}:${path}`)})`,
        )
        .replace(/\[folder:([a-z]+):(\d+)\](?!\()/g, (_, volume: string, owner: string) =>
            `[${volume} ${owner}](${FolderRefHrefPrefix}${encodeURIComponent(`${volume}:${owner}`)})`,
        );
}
