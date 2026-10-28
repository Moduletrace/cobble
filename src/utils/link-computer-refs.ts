import linkRefsInText from "./link-refs-in-text";

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
 * The kinds of ref a message can carry, as written before the colon.
 */
const RefKinds = "computer|take-over|bot|workspace|proposal|hook-proposal|secret|secret-request|question|graphic|room|file|folder";

/**
 * A code span holding nothing but one ref (`` `[file:12]` ``): bots often
 * quote refs that way, and it still means the ref.
 */
const LoneRefInCode = new RegExp(`(?<!\`)(\`{1,2})[ \\t]*(\\[(?:${RefKinds}):[^\\]\`\\n]+\\])[ \\t]*\\1(?!\`)`, "g");

/**
 * Fenced code blocks (closed or still open at the end) and inline code
 * spans, kept apart so refs inside them stay as written.
 */
const CodeParts = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]+`)/g;

/**
 * Turns the refs in a message into markdown links the chat swaps for
 * buttons, chips and cards (`linkRefsInText`). A ref quoted alone in a code
 * span counts as the ref; one inside longer code (a span with other text, a
 * fenced block) stays literal text, since a link there would only show as
 * markdown.
 */
export default function linkComputerRefs({ text }: { text: string }) {
    return text
        .replace(LoneRefInCode, (_, _ticks: string, ref: string) => ref)
        .split(CodeParts)
        .map((part, index) => (index % 2 ? part : linkRefsInText({ text: part })))
        .join("");
}
