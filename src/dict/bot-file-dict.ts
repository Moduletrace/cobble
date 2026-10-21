/**
 * Where a bot file lives: a bot's own directory (`DATA_DIR/bots/<id>`) or
 * a workspace's shared one (`DATA_DIR/workspaces/<id>`), which the bots
 * working there and the coordinator reach.
 */
export const BotFileScopes = [
    {
        title: "Bot",
        value: "bot",
    },
    {
        title: "Workspace",
        value: "workspace",
    },
] as const;

export type BotFileScope = (typeof BotFileScopes)[number]["value"];

/**
 * What a file is for. Only the display and the icon use it; the bot picks
 * it when it writes one.
 */
export const BotFilePurposes = [
    {
        title: "Upload",
        value: "upload",
    },
    {
        title: "Writing",
        value: "writing",
    },
    {
        title: "Image",
        value: "image",
    },
    {
        title: "PDF",
        value: "pdf",
    },
    {
        title: "Artifact",
        value: "artifact",
    },
] as const;

export type BotFilePurpose = (typeof BotFilePurposes)[number]["value"];

/**
 * How a file got into the bot's storage.
 */
export const BotFileSources = [
    {
        title: "Chat upload",
        value: "chat-upload",
    },
    {
        title: "Bot write",
        value: "bot-write",
    },
    {
        title: "Tool",
        value: "tool",
    },
] as const;

export type BotFileSource = (typeof BotFileSources)[number]["value"];

/**
 * The `app_settings` key holding the per-owner storage quota, in MB.
 */
export const BotFileQuotaSettingKey = "bot_files_quota_mb";

/**
 * The top folder chat uploads land in, under the conversation's scope.
 */
export const BotUploadFolder = "uploads";

/**
 * Extensions a bot's text extraction reads without a model: documents
 * that are already text once unpacked.
 */
export const BotTextFileExtensions = [
    "txt",
    "md",
    "markdown",
    "csv",
    "json",
    "html",
    "htm",
    "xml",
    "yml",
    "yaml",
    "log",
    "tsv",
    "pdf",
    "docx",
] as const;

/**
 * What a file's extension says it is, for the storage row and the icon.
 */
export const BotImageFileExtensions = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"];
