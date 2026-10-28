import type {
    BUN_SQLITE_COBBLE_ALL_TYPEDEFS,
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_BOT_SESSIONS,
    BUN_SQLITE_COBBLE_BOT_TASK_STEPS,
    BUN_SQLITE_COBBLE_BOT_TASKS,
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_CHATROOMS,
    BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES,
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CRON_JOBS,
    BUN_SQLITE_COBBLE_BOT_HOOKS,
    BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS,
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_TASK_MEDIA,
    BUN_SQLITE_COBBLE_TASK_NOTES,
    BUN_SQLITE_COBBLE_TASKS,
    BUN_SQLITE_COBBLE_USER_TYPES,
    BUN_SQLITE_COBBLE_USERS,
    BUN_SQLITE_COBBLE_WORKSPACES,
    BunSQLiteTables,
} from "@/db/types/db";
import type { UserTypes } from "../dict/user-types-dict";
import type { BotPermissions, BotTypes } from "../dict/bot-types-dict";
import type { StorageVolume } from "../utils/storage-volumes";
import type { RunningVersion } from "../utils/running-version";
import type { WebsocketRooms } from "../dict/websocket-rooms";
import type { LucideIcon } from "lucide-react";
import type { ServerQueryParam } from "@moduletrace/bun-sqlite";
import type { MediaParadigms, MediaTypes } from "../dict/media-dict";
import type { APIResponseObject, BunextPageModuleServerReturnURLObject } from "@moduletrace/bunext/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "./sql-joins";
import type { ImageInputToBase64FunctionReturn } from "@moduletrace/twui/utils/form/imageInputToBase64";
import type { HarnessKind } from "../dict/harness-dict";
import type { HarnessProviderKind } from "../dict/harness-provider-dict";
import type { EnvParadigm, KnownEnv, SecretRequestStatus } from "../dict/env-dict";
import type { ContainerStatus } from "../dict/computer-dict";
import type { BotFace, BotKind, BotMessageReactionEmoji } from "../dict/bot-dict";
import type { HarnessCallSettings, TokenUsageSummary } from "../harness/usage/types";
import type { McpServerStatus, McpTransport } from "../dict/mcp-dict";
import type { ExtensionProposalKind, ExtensionProposalStatus } from "../dict/extension-proposal-dict";
import type { HookProposalAction } from "../dict/bot-hook-dict";
import type { PwaInstallIcon } from "../data/pwa-data";
import type {
    CustomToolHttpMethod,
    CustomToolKind,
    CustomToolScriptLanguage,
    CustomToolStatus,
} from "../dict/custom-tool-dict";

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    username?: string;
    image?: string;
    image_thumbnail?: string;
    logged_in_status: boolean;
    verification_status?: number;
    date?: number;
    csrf?: string;
    roles?: string;
};

/**
 * A bot row with its face and status line as the user it's for sees them
 * (`botFaceSql`). Faces are per user, so a bot row read without one has
 * neither.
 */
export type BotWithFace = BUN_SQLITE_COBBLE_BOTS & {
    face?: BotFace;
    status_line?: string;
};

/**
 * A bot row plus its conversation (in its own chat or one workspace):
 * unread, latest activity and latest message, for the rail.
 */
export type BotWithLastMessage = BotWithFace & {
    /**
     * In a workspace's crew: the bot is that workspace's admin
     * (`bot_types`), shown with `AdminShield` beside its name.
     */
    is_admin?: boolean | null;
    unread?: number | null;
    last_activity_at?: number | null;
    last_message_text?: string | null;
    last_message_at?: number | null;
};

/**
 * A bot's schedule with what the routines page shows beside it: the bot
 * and the workspace it runs in.
 */
/**
 * A bot a task or routine can be handed over to, for the picker.
 */
export type HandOverTarget = {
    id: number;
    name: string;
};

export type CronJobWithNames = BUN_SQLITE_COBBLE_CRON_JOBS & {
    bot_name?: string | null;
    bot_kind?: string | null;
    bot_hue?: string | null;
    bot_color?: string | null;
    bot_stone?: string | null;
    bot_face?: string | null;
    bot_image_media_id?: number | null;
    workspace_name?: string | null;
};

/**
 * A bot's hook as its owner sees it: never its token hash or signing
 * secret, only whether it has one, with its bot (its face as the user sees
 * it) and workspace names.
 */
export type BotHookWithNames = Omit<BUN_SQLITE_COBBLE_BOT_HOOKS, "token_hash" | "signing_secret" | "watch_token"> & {
    has_signing_secret?: number | null;
    /**
     * For browser notifications: the watched computer's name.
     */
    watch_computer_name?: string | null;
    /**
     * The title of the session its runs land in, when it has one of its
     * own (`session_id`).
     */
    session_title?: string | null;
    bot_name?: string | null;
    bot_kind?: string | null;
    bot_hue?: string | null;
    bot_color?: string | null;
    bot_stone?: string | null;
    bot_face?: string | null;
    bot_image_media_id?: number | null;
    workspace_name?: string | null;
};

/**
 * One call to a hook with its hook's name and bot, as searches list it
 * (`searchHookCallsSql`): payload and response are previews there, whole
 * in `grabBotHookEvent`.
 */
export type BotHookCall = BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS & {
    hook_title?: string | null;
    bot_id?: number | null;
    workspace_id?: number | null;
};

/**
 * What syncing a computer's notification watcher did
 * (`syncComputerNotifyWatch`).
 */
export type NotifyWatchSync = {
    ok: boolean;
    /**
     * Whether the watcher runs (false when no hook wants it).
     */
    watching: boolean;
    /**
     * `restarted`: Chrome was restarted so it sends notifications to the
     * watcher. `needs_restart`: it still has to be, once the task working
     * there is done (the next sync does it).
     */
    browser?: "ok" | "restarted" | "needs_restart" | "missing";
    hooks: number;
    error?: string;
};

/**
 * A hook just made or given a new token. A URL hook's token is shown this
 * once; a browser-notification hook has none to show, only how setting up
 * its computer's watcher went.
 */
export type BotHookWithToken = {
    hook: BotHookWithNames;
    token?: string;
    watch?: NotifyWatchSync;
};

/**
 * Which session a hook's runs land in: `current` follows the
 * conversation's active session, `new` starts one of its own beside it,
 * a number is one of the conversation's sessions.
 */
export type HookSessionChoice = "current" | "new" | number;

/**
 * Where a hook can run, for the picker: its bot's own chat
 * (`workspace_id` null) or one of the bot's workspaces.
 */
export type HookPlace = {
    workspace_id: number | null;
    name: string;
};

/**
 * A task with what a list shows beside it: the bot and workspace it belongs
 * to, and its latest note.
 */
export type TaskWithNames = BUN_SQLITE_COBBLE_TASKS & {
    bot_name?: string | null;
    bot_kind?: string | null;
    bot_hue?: string | null;
    bot_color?: string | null;
    bot_stone?: string | null;
    bot_face?: string | null;
    bot_image_media_id?: number | null;
    workspace_name?: string | null;
    /**
     * Its newest note's text, for the row's second line.
     */
    latest_note?: string | null;
    /**
     * How many files it carries.
     */
    media_count?: number | null;
};

/**
 * A file linked to a task, joined with the `media` row it's served from.
 */
export type TaskFile = BUN_SQLITE_COBBLE_TASK_MEDIA & {
    media_type?: string | null;
    mime_type?: string | null;
    /**
     * The `media` row's title, when the link has no name of its own.
     */
    media_title?: string | null;
    /**
     * Whether the `media` row is still there.
     */
    missing?: boolean;
};

/**
 * A note on a task, with the name of the bot that wrote it.
 */
export type TaskNote = BUN_SQLITE_COBBLE_TASK_NOTES & {
    bot_name?: string | null;
};

/**
 * A task with its notes and files and who added it: what the task modal
 * renders.
 */
export type TaskDetail = TaskWithNames & {
    created_by_bot_name?: string | null;
    created_by_user_name?: string | null;
    notes: TaskNote[];
    files: TaskFile[];
};

/**
 * A session in a conversation's sessions modal.
 */
export type BotSessionListItem = BUN_SQLITE_COBBLE_BOT_SESSIONS & {
    message_count: number;
    last_message_text?: string | null;
};

/**
 * A workspace in the rail: unread while any conversation in it is.
 */
export type WorkspaceWithActivity = BUN_SQLITE_COBBLE_WORKSPACES & {
    unread: number;
    last_activity_at?: number | null;
};

/**
 * One recent conversation in a workspace, for its dashboard: the user's
 * session with the bot, and the bot it's with.
 */
export type WorkspaceActivityItem = BUN_SQLITE_COBBLE_BOT_SESSIONS & {
    message_count: number;
    last_message_text?: string | null;
    bot_name?: string | null;
    bot_image_media_id?: number | null;
    bot_hue?: string | null;
    bot_color?: string | null;
    bot_stone?: string | null;
    bot_face?: string | null;
};

/**
 * A computer with its container's state, for lists and the Add flow.
 */
export type ComputerWithStatus = BUN_SQLITE_COBBLE_COMPUTERS & {
    status?: ContainerStatus | null;
    /**
     * Why setting it up failed, while `status` is `failed`.
     */
    error?: string | null;
};

/**
 * A bot in a workspace, with what it has for that workspace alone.
 */
export type WorkspaceBot = BotWithLastMessage & {
    workspace_system_prompt?: string | null;
    workspace_memory?: string | null;
};

/**
 * A bot's instructions and memory for one workspace, as its editor loads
 * them (`api/admin/workspaces/workspace-bot`).
 */
export type WorkspaceBotInstructions = {
    system_prompt: string;
    memory: string;
};

/**
 * A workspace a bot works in, with what the bot has for that workspace
 * alone.
 */
export type BotWorkspace = WorkspaceWithActivity & {
    workspace_system_prompt?: string | null;
    workspace_memory?: string | null;
    /**
     * The bot is this workspace's admin (`bot_types`).
     */
    is_admin?: boolean;
};

/**
 * The task shown in the working-on panel, with its ordered steps.
 */
export type BotTaskWithSteps = BUN_SQLITE_COBBLE_BOT_TASKS & {
    steps: BUN_SQLITE_COBBLE_BOT_TASK_STEPS[];
    /**
     * What its newest job has done so far, oldest first (`grabBotJobUpdates`).
     */
    updates: BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES[];
};

/**
 * What stopping a bot reports back: how many of its jobs were stopped and
 * how many of them are still open (an attempt that has to notice its
 * lock is gone can take a heartbeat).
 */
export type BotStoppedPayload = {
    bot_id: number;
    stopped: number;
    remaining: number;
};

/**
 * `server:bot-job-update` data: a step a running job just took, with the
 * task it's for (null for a reply).
 */
export type BotJobUpdateData = BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES & {
    task_id: number | null;
    /**
     * The conversation session the job belongs to.
     */
    session_id: number | null;
};

/**
 * A bot taking part in a chatroom, as the room draws it.
 */
export type ChatroomBot = Pick<
    BUN_SQLITE_COBBLE_BOTS,
    "id" | "name" | "kind" | "color" | "stone" | "hue" | "image_media_id"
>;

/**
 * A job still open in a chatroom: which bot, in which of its room
 * sessions, whether it has started and its latest step.
 */
export type ChatroomJob = {
    bot_id: number;
    session_id: number;
    status: string;
    progress?: string | null;
};

/**
 * A chatroom with the bots in it (asking bot first, then the coordinator,
 * then those it asked), for the rail and the room's header.
 */
export type ChatroomSummary = BUN_SQLITE_COBBLE_CHATROOMS & {
    bots: ChatroomBot[];
    /**
     * Whether a job in the room can still run.
     */
    working?: boolean;
    /**
     * The jobs still open in the room, for its status rows.
     */
    jobs?: ChatroomJob[];
    /**
     * The workspace the request came from, by name.
     */
    workspace_name?: string | null;
};

/**
 * `server:chatroom-message` data: a message one of the room's bots posted.
 */
export type ChatroomMessageData = {
    chatroom_id: number;
    message: BUN_SQLITE_COBBLE_BOT_MESSAGES;
};

/**
 * `server:bot-session` data: one of the user's conversation sessions was
 * started, named or otherwise changed.
 */
export type BotSessionChangedData = {
    session_id: number;
    bot_id: number;
    workspace_id: number | null;
};

/**
 * `server:bot-created` data: a bot the user can now see, the workspaces
 * it's in, and whether it belongs in their own chat list (the main rail).
 */
export type BotCreatedData = {
    bot: BotWithLastMessage;
    workspace_ids: number[];
    in_own_chat: boolean;
};

/**
 * `server:workspace-created` data: a workspace the user can now see, as
 * their rail lists it.
 */
export type WorkspaceCreatedData = {
    workspace: WorkspaceWithActivity;
};

/**
 * `server:workspace-removed` data: the workspace that was deleted.
 */
export type WorkspaceRemovedData = {
    workspace_id: number;
};

/**
 * `server:bot-removed` data: the bot that was deleted.
 */
export type BotRemovedData = {
    bot_id: number;
};

/**
 * `server:bot-updated` data: the bot's new face and status line, and its
 * active task (null when there is none).
 */
export type BotUpdatedData = {
    id: number;
    face: BotFace;
    status_line: string;
    task: BotTaskWithSteps | null;
    /**
     * The computer the bot is on, when the push knows it (a switch, or the
     * live relay). Null means its main one.
     */
    computer_id?: number | null;
    /**
     * The workspaces the bot is in, when the push read them (a membership
     * change). A workspace's crew drops a bot that's no longer in it.
     */
    workspace_ids?: number[];
    /**
     * Its colour and stone, when the push read them (a recolour, or any bot
     * change): every rail row and avatar takes them without a reload.
     */
    color?: string | null;
    stone?: string | null;
    /**
     * Its picture, when the push read it (a bot that set its own face): the
     * rail and the thread swap the stone for it without a reload. Null means
     * it has none.
     */
    image_media_id?: number | null;
    /**
     * The workspaces it's admin of, when the push read them: a workspace's
     * crew shows or drops its shield without a reload.
     */
    admin_workspace_ids?: number[];
};

/**
 * `api/admin/bots/session-messages`: the session's latest messages, and
 * the bot as the session's user sees it now (face, status line, active
 * task), so a conversation that missed pushes catches up on both.
 */
export type SessionMessagesResponse = APIResponseObject<BotMessageWithAttachments> & {
    bot?: BotUpdatedData | null;
};

/**
 * `server:workspace-updated` data: a workspace's picture changed, so the
 * rail and its header show the new one.
 */
export type WorkspaceUpdatedData = {
    workspace_id: number;
    image_media_id: number | null;
};

/**
 * A model provider as the client sees it: never the key itself.
 */
export type PublicHarnessProvider = {
    id: number;
    kind: HarnessProviderKind;
    name: string;
    base_url: string;
    enabled: boolean;
    has_key: boolean;
    /**
     * A key is set in the provider's environment variable.
     */
    has_env_key: boolean;
    needs_key: boolean;
    key_env?: string;
    last_synced_at?: number;
    sync_error?: string;
};

/**
 * A model a harness can be set to, for the Models settings page.
 */
export type HarnessModelOption = {
    id: number;
    provider_id: number;
    provider_name: string;
    slug: string;
    name: string;
    free: boolean;
    voices?: string[];
    /**
     * The generation settings the model takes; undefined: all of them.
     */
    supported_parameters?: string[];
};

/**
 * One harness on the Models settings page: its setting, the models it can
 * be set to, and what it runs on right now.
 */
/**
 * A provider a harness can be limited to.
 */
export type HarnessProviderChoice = {
    id: number;
    name: string;
};

export type HarnessOverview = {
    harness: HarnessKind;
    title: string;
    description: string;
    required: boolean;
    /**
     * Picks a free model itself when none is picked. Otherwise it isn't
     * available until one is.
     */
    automatic: boolean;
    model_id?: number;
    /**
     * The provider the harness is limited to; undefined: any.
     */
    provider_id?: number;
    /**
     * The providers with a model that can do this job.
     */
    providers: HarnessProviderChoice[];
    fallback: boolean;
    enabled: boolean;
    options: Record<string, unknown>;
    models: HarnessModelOption[];
    /**
     * The first model it would try now, if any.
     */
    current?: HarnessModelOption & { source: "pinned" | "auto" };
    /**
     * How many models it would try in all.
     */
    candidate_count: number;
    /**
     * On a bot's page: true while the bot uses the default for this
     * harness, and what the default runs on.
     */
    inherit?: boolean;
    default?: Pick<HarnessOverview, "enabled" | "current" | "candidate_count">;
};

/**
 * One harness's controls on the Models settings page. `model_id` null is
 * automatic.
 */
export type HarnessFormValue = {
    /**
     * On a bot's page: use the default instead of its own setting.
     */
    inherit?: boolean;
    model_id: number | null;
    provider_id: number | null;
    fallback: boolean;
    enabled: boolean;
    voice?: string;
    /**
     * Generation settings (temperature, reasoning effort, ...), only the
     * ones the picked model takes.
     */
    params?: Record<string, number | string>;
};

export type HarnessSettingsFormObject = Partial<
    Record<HarnessKind, HarnessFormValue>
>;

/**
 * The Models settings page data, also returned by every harness API call
 * so the page updates without a reload.
 */
export type HarnessOverviewPayload = {
    providers: PublicHarnessProvider[];
    harnesses: HarnessOverview[];
};

/**
 * The install-wide part of a harness overview: what it is for and the
 * models it can pick. Every bot and workspace shares it, so the models
 * modal caches one copy per user.
 */
export type HarnessCatalog = Pick<
    HarnessOverview,
    | "harness"
    | "title"
    | "description"
    | "required"
    | "automatic"
    | "providers"
    | "models"
>;

export type HarnessCatalogPayload = {
    harnesses: HarnessCatalog[];
};

/**
 * The per-bot (or per-workspace) part of a harness overview: the setting,
 * what it runs on now, and what the default runs on.
 */
export type HarnessSettingOverview = Omit<
    HarnessOverview,
    | "title"
    | "description"
    | "required"
    | "automatic"
    | "providers"
    | "models"
> & {
    /**
     * A picked model the catalog no longer lists (its provider dropped it).
     * The merge adds it back so the form can show and keep it.
     */
    pinned_model?: HarnessModelOption;
    /**
     * The provider the setting is limited to when the catalog has no model
     * from it, so the form still shows the limit.
     */
    unavailable_provider?: HarnessProviderChoice;
};

export type BotHarnessSettingsPayload = {
    harnesses: HarnessSettingOverview[];
};

/**
 * An env as the Environment settings page sees it. `value` is sent only
 * for non-secret envs; secrets are replaced, never read back.
 */
export type PublicEnv = {
    id: number;
    key: string;
    description: string;
    paradigm: EnvParadigm;
    workspace_id: number | null;
    computer_id: number | null;
    bot_id: number | null;
    secret: boolean;
    expose_to_computers: boolean;
    value?: string;
    /**
     * An `EnvDict` key the app itself reads.
     */
    known: boolean;
};

/**
 * Somewhere envs can be set: general, or one of the user's workspaces,
 * computers or bots.
 */
/**
 * A user's personal secret for one bot (an env with paradigm \`user\`), as
 * settings pages list it: never its value.
 */
export type PersonalSecret = {
    id: number;
    key: string;
    description: string;
    bot_id: number;
    bot_name: string;
    user_id: number;
    user_name: string;
    updated_at: number;
};

/**
 * A secret a bot asked the user for (\`[secret-request:ID]\`), as its chip
 * and card show it. Never holds a value.
 */
/**
 * A bot graphic (`[graphic:ID]`) as its card and page name it. The HTML
 * itself is only ever served at `/graphics/<id>`.
 */
export type BotGraphicView = {
    id: number;
    title: string;
    version: number;
    bot_id: number;
    bot_name: string;
    workspace_id: number | null;
    session_id: number | null;
    updated_at: number;
};

export type SecretRequestView = {
    id: number;
    key: string;
    description: string;
    reason: string;
    status: SecretRequestStatus;
    bot_id: number;
    bot_name: string;
    /**
     * The personal secret it saved, once saved.
     */
    env_id: number | null;
};

/**
 * A secret ref (\`[secret:ID]\`) as its chip shows it before anyone asks
 * for the value: the key, and whether this viewer may reveal it.
 */
export type SecretRefView = {
    id: number;
    key: string;
    description: string;
    can_reveal: boolean;
};

export type EnvScope = {
    paradigm: EnvParadigm;
    id: number | null;
    title: string;
};

/**
 * One scope's envs, as a bot's or workspace's settings page sees them: the
 * envs set there, and whether the viewer may change them.
 */
export type ScopedEnvsPayload = {
    scope: EnvScope;
    envs: PublicEnv[];
    can_manage: boolean;
};

/**
 * What saving or removing an env answers with: the Environment page's whole
 * overview, or the one bot's or workspace's envs the settings pages show.
 */
export type EnvsMutationResult = {
    overview?: EnvsOverviewPayload;
    scoped?: ScopedEnvsPayload | null;
};

/**
 * An app setting on the Environment page: whether it's saved, or comes
 * from the server's environment instead.
 */
export type KnownEnvStatus = KnownEnv & {
    saved: boolean;
    from_process: boolean;
};

/**
 * One tool an MCP server offers, as last listed (`mcp_servers.tools_cache`).
 */
export type McpToolInfo = {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
};

/**
 * Who gets an MCP server or custom tool: every bot, or the bots and
 * workspaces it's attached to.
 */
export type ExtensionAccess = {
    all_bots: boolean;
    bot_ids: number[];
    workspace_ids: number[];
};

/**
 * An `mcp_servers` row with its JSON read.
 */
export type McpServerRecord = {
    id: number;
    name: string;
    slug: string;
    description: string;
    transport: McpTransport;
    url: string;
    headers: Record<string, string>;
    command: string;
    setup_command: string;
    env: Record<string, string>;
    excluded_tools: string[];
    tools: McpToolInfo[];
    all_bots: boolean;
    enabled: boolean;
    status: McpServerStatus;
    last_error: string;
    last_synced_at: number | null;
    /**
     * When its settings last changed (an edit or who gets it), not a run or check.
     */
    updated_at: number | null;
};

export type CustomToolHttpConfig = {
    method: CustomToolHttpMethod;
    url: string;
    headers?: Record<string, string>;
    body?: string;
    timeout_ms?: number;
};

export type CustomToolScriptConfig = {
    language: CustomToolScriptLanguage;
    code: string;
    timeout_ms?: number;
};

export type CustomToolPromptConfig = {
    prompt: string;
};

/**
 * A `custom_tools` row with its JSON read, `config` matching its kind.
 */
export type CustomToolRecord = {
    id: number;
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    all_bots: boolean;
    enabled: boolean;
    status: CustomToolStatus;
    last_error: string;
    last_checked_at: number | null;
    /**
     * When its settings last changed (an edit or who gets it), not a run or check.
     */
    updated_at: number | null;
} & (
    | { kind: "http"; config: CustomToolHttpConfig }
    | { kind: "script"; config: CustomToolScriptConfig }
    | { kind: "prompt"; config: CustomToolPromptConfig }
);

/**
 * A `skills` row: a runbook a bot loads when it applies.
 */
export type SkillRecord = {
    id: number;
    name: string;
    slug: string;
    description: string;
    body: string;
    all_bots: boolean;
    enabled: boolean;
    /**
     * When its settings last changed (an edit or who gets it), not a run or check.
     */
    updated_at: number | null;
};

/**
 * One env a proposed MCP server or tool sends (`extensionEnvUses`), and
 * where it's saved: `general`, or the bots and workspaces it's saved for
 * only. Nothing saved means the user has to add it.
 */
export type ExtensionProposalEnv = {
    key: string;
    where: string;
    saved_in: string[];
};

/**
 * What a proposed MCP server or tool does, as the confirm card shows it:
 * each line read from the config by the app, never from what the bot said.
 */
export type ExtensionProposalDetail = {
    label: string;
    value: string;
    /**
     * Long or code-like: shown as a block.
     */
    block?: boolean;
};

/**
 * An MCP server or tool the coordinator proposed (`extension_proposals`),
 * as its chip and confirm card show it to the super admin.
 */
export type ExtensionProposalView = {
    id: number;
    kind: ExtensionProposalKind;
    /**
     * The one it changes, null for a new one.
     */
    extension_id: number | null;
    name: string;
    status: ExtensionProposalStatus;
    /**
     * Still pending, but past `expires_at`: it can't be confirmed.
     */
    expired: boolean;
    expires_at: number;
    outcome: string;
    result_id: number | null;
    /**
     * Where it sends requests from the app; null for a script or a prompt.
     */
    host: string | null;
    envs: ExtensionProposalEnv[];
    details: ExtensionProposalDetail[];
    /**
     * The bot's background check, in its own words.
     */
    research: string;
    sources: string[];
};

/**
 * A hook a bot proposed making or changing (`hook_proposals`), as its chip
 * and confirm card show it to the user it was proposed to: every detail
 * read by the app from what Confirm would save, the bot's reason beside
 * them, labelled as its own.
 */
export type HookProposalView = {
    id: number;
    action: HookProposalAction;
    /**
     * The hook it changes, null for a new one.
     */
    hook_id: number | null;
    title: string;
    bot_id: number;
    bot_name: string;
    status: ExtensionProposalStatus;
    /**
     * Still pending, but past `expires_at`: it can't be confirmed.
     */
    expired: boolean;
    expires_at: number;
    outcome: string;
    result_id: number | null;
    /**
     * Confirming makes a URL an outside service calls, shown then, once.
     */
    makes_url: boolean;
    details: ExtensionProposalDetail[];
    /**
     * Why the bot proposes it, in its own words.
     */
    reason: string;
};

/**
 * A hook proposal just decided: as it now stands, and for a new hook
 * called at a URL its token, shown this once to the user who confirmed it
 * (never stored, never told to the bot).
 */
export type HookProposalDecision = {
    view: HookProposalView;
    token?: string;
};

/**
 * A skill as the Skills settings page shows it: nothing secret in one, so
 * it's the row with who gets it instead of `all_bots`.
 */
export type PublicSkill = Omit<SkillRecord, "all_bots"> & {
    access: ExtensionAccess;
};

/**
 * An MCP server as the MCPs settings page shows it. Only super admins get
 * how it's reached (`url`, `headers`, `command`, `setup_command`, `env`).
 */
export type PublicMcpServer = Omit<
    McpServerRecord,
    "url" | "headers" | "command" | "setup_command" | "env" | "all_bots"
> & {
    access: ExtensionAccess;
    url?: string;
    headers?: Record<string, string>;
    command?: string;
    setup_command?: string;
    env?: Record<string, string>;
};

/**
 * A custom tool as the Tools settings page shows it. Only super admins get
 * its `parameters` and `config`.
 */
export type PublicCustomTool = {
    id: number;
    name: string;
    description: string;
    kind: CustomToolKind;
    enabled: boolean;
    status: CustomToolStatus;
    last_error: string;
    last_checked_at: number | null;
    updated_at: number | null;
    access: ExtensionAccess;
    parameters?: Record<string, unknown>;
    config?: CustomToolHttpConfig | CustomToolScriptConfig | CustomToolPromptConfig;
};

/**
 * The bots and workspaces an MCP server or tool can be attached to. The
 * coordinator is listed for the super admin only.
 */
export type ExtensionTargets = {
    bots: { id: number; name: string; role: string; kind: string }[];
    workspaces: { id: number; name: string }[];
    /**
     * A super admin: adds, edits and deletes, and sets "all bots".
     */
    can_edit: boolean;
};

/**
 * What a bot can be given: an MCP server, a custom tool, a skill or a
 * knowledgebase.
 */
export type BotExtensionKind = "mcp" | "tool" | "skill" | "knowledgebase";

/**
 * One MCP server, tool, skill or knowledgebase a bot has, as its settings
 * page and its chat's composer show it.
 */
export type BotExtension = {
    kind: BotExtensionKind;
    id: number;
    name: string;
    description: string;
    /**
     * One line on what it is, e.g. "HTTP request" or "Remote · 12 tools".
     */
    detail: string;
    state: "ok" | "error" | "untested";
    enabled: boolean;
    /**
     * `bot`: given to the bot, removable. `workspace`: the workspace's,
     * only while it works there.
     */
    source: "bot" | "workspace";
};

/**
 * A bot's MCP servers, tools and skills, and what can be added. Only super admins
 * and admins (the super admin alone for the coordinator) manage them.
 */
export type BotExtensionsPayload = {
    attached: BotExtension[];
    addable: { kind: BotExtensionKind; id: number; name: string }[];
    can_manage: boolean;
};

export type McpServersOverviewPayload = ExtensionTargets & {
    servers: PublicMcpServer[];
};

/**
 * How many messages a session takes (Settings > General,
 * `grab-bot-session-max-messages.ts`).
 */
export type SessionLengthOverview = {
    max_messages: number;
    default_messages: number;
    max: number;
};

/**
 * How long hook calls are kept (Settings > General,
 * `grab-hook-events-keep-days.ts`).
 */
export type ChatroomRetentionOverview = {
    keep_days: number;
    default_days: number;
    max_days: number;
    max_per_place: number;
    default_per_place: number;
    max_per_place_ceiling: number;
};

export type HookCallRetentionOverview = {
    keep_days: number;
    default_days: number;
    max: number;
};

/**
 * How long logs are kept (Settings > General, `grab-logs-keep-days.ts`).
 */
export type LogRetentionOverview = {
    keep_days: number;
    default_days: number;
    max: number;
};

/**
 * The install's skill limits (Settings > General, `grab-skill-limits.ts`).
 */
export type SkillLimitsOverview = {
    /**
     * The longest runbook a skill may save right now.
     */
    body_max_chars: number;
    /**
     * How much of a runbook `load_skill` hands back right now.
     */
    body_shown_chars: number;
    /**
     * The longest runbook when the install saved no limit.
     */
    body_max_default: number;
    /**
     * What `load_skill` hands back when the install saved no limit.
     */
    body_shown_default: number;
    /**
     * The most the settings page accepts for either.
     */
    max: number;
};

export type SkillsOverviewPayload = ExtensionTargets & {
    skills: PublicSkill[];
    /**
     * The install's runbook limits, for the skill form's hints.
     */
    limits: SkillLimitsOverview;
};

/**
 * A `knowledgebases` row with its flags read as booleans.
 */
export type KnowledgebaseRecord = {
    id: number;
    name: string;
    description: string;
    all_bots: boolean;
    enabled: boolean;
    updated_at: number | null;
};

/**
 * A knowledgebase as its settings page lists it: who gets it and how much
 * of it is searchable. Its documents load when it's opened.
 */
export type PublicKnowledgebase = Omit<KnowledgebaseRecord, "all_bots"> & {
    access: ExtensionAccess;
    document_count: number;
    /**
     * Documents still waiting to be read, and ones that failed with
     * nothing to search.
     */
    pending_count: number;
    error_count: number;
    /**
     * Documents whose last read went wrong in any way, even ones still
     * found by their words.
     */
    warning_count: number;
    /**
     * Documents searchable by words only (no model, or it failed), or
     * embedded by another model than the install's current one: a
     * re-index fixes all three.
     */
    stale_count: number;
    size: number;
};

/**
 * One document in a knowledgebase.
 */
export type KnowledgebaseDocument = {
    id: number;
    knowledgebase_id: number;
    name: string;
    source: "file" | "text";
    mime_type: string;
    size: number;
    chunk_count: number;
    embedding_model: string | null;
    ingested_at: number | null;
    ingest_error: string | null;
    /**
     * Being read now: never read yet, or queued to be read again.
     */
    indexing: boolean;
    created_at: number | null;
};

/**
 * A knowledgebase's documents, and a text document's content when one is
 * opened to edit.
 */
export type KnowledgebaseDocumentsPayload = {
    knowledgebase_id: number;
    documents: KnowledgebaseDocument[];
};

export type KnowledgebasesOverviewPayload = ExtensionTargets & {
    knowledgebases: PublicKnowledgebase[];
    /**
     * The install's embedding model (Settings > Models), null when none is
     * picked: then knowledgebases are searched by words only.
     */
    embedding_model: string | null;
};

export type CustomToolsOverviewPayload = ExtensionTargets & {
    tools: PublicCustomTool[];
};

/**
 * What testing an MCP server's form returned: its tools, or why it didn't
 * connect.
 */
export type McpServerTestPayload = {
    ok: boolean;
    tools: McpToolInfo[];
    error?: string;
};

/**
 * What trying a custom tool returned, as a bot would read it.
 */
export type CustomToolTestPayload = {
    output: string;
    ok: boolean;
    /**
     * The page data, with the tool's new status.
     */
    overview: CustomToolsOverviewPayload;
};

export type EnvsOverviewPayload = {
    scopes: EnvScope[];
    envs: PublicEnv[];
    known: KnownEnvStatus[];
    /**
     * Every user's personal secrets, set from the chat.
     */
    personal: PersonalSecret[];
};

/**
 * A bot file as the chat's files modal lists it.
 */
export type PublicBotFile = {
    id: number;
    name: string;
    path: string;
    size: number;
    media_type: string;
    purpose: string;
    scope: string;
    owner_id: number;
    created_at: number;
    /**
     * Where the bytes are served (`/media/<media id>`, private).
     */
    url: string;
};

/**
 * A conversation's files, with the directory's usage against its quota.
 */
export type BotFileScopesPayload = {
    files: PublicBotFile[];
    folders: { scope: string; owner_id: number; path: string }[];
    usage: { bytes: number; files: number };
    quota_bytes: number;
    quota_mb: number;
};

/**
 * One entry in a folder the files browser shows: a file or a subfolder.
 */
export type StorageEntry = {
    name: string;
    /**
     * Where it is inside the volume, e.g. `seo/coderank/raw`.
     */
    path: string;
    kind: "file" | "folder";
    size: number;
    modified_at: number;
    media_type?: string;
    /**
     * The `bot_files` row that holds it, when the folder is a bot's or a
     * workspace's.
     */
    file_id?: number;
    /**
     * Where it opens: a `bot_files` row's media URL, else the browser's own
     * streaming route.
     */
    url?: string;
    /**
     * What an id folder in a computer's workspace is: the bot's, user's or
     * workspace's name.
     */
    label?: string;
};

/**
 * One folder of the files browser: what it holds and how to get back up.
 */
export type StorageFolderPayload = {
    spec: { volume: StorageVolume; owner_id: number };
    /**
     * What the folder is called: the bot's, workspace's or computer's name.
     */
    label: string;
    /**
     * The folder asked for, inside the volume (empty at the top).
     */
    path: string;
    breadcrumbs: { name: string; href: string }[];
    entries: StorageEntry[];
    total: number;
    offset: number;
    /**
     * The folder asked for isn't on disk (a stale link, or a computer whose
     * home directory the app can't find), as opposed to an empty one.
     */
    missing?: boolean;
};

/**
 * What a database table's rows are identified by: a primary key column,
 * the rowid a table without one still has, or nothing at all (a virtual
 * table with neither).
 */
export type DatabaseTableKey = {
    kind: "rowid" | "column" | "none";
    /**
     * The primary key column's name, for `kind: "column"`.
     */
    name?: string;
};

export type DatabaseTableColumn = {
    name: string;
    /**
     * SQLite's declared type, empty when the column has none (a view or a
     * virtual table).
     */
    type: string;
    pk: boolean;
};

/**
 * How a search matches: every word somewhere in the record's text, or the
 * whole phrase somewhere in it.
 */
export type DatabaseSearchMode = "every_word" | "phrase";

/**
 * The period the usage page totals, in epoch ms.
 */
export type UsageWindow = {
    days: number;
    start: number;
    end: number;
};

/**
 * Everything the usage page shows for one window: what the install's
 * model calls spent, in total, per day, per harness and per model, with
 * the day before the window and the last seven days for comparison.
 */
export type UsageOverview = {
    window: UsageWindow;
    totals: TokenUsageSummary;
    by_harness: (TokenUsageSummary & { harness: string })[];
    days: (TokenUsageSummary & { at: number; label: string })[];
    models: (TokenUsageSummary & {
        model_slug: string;
        model_name: string | null;
        provider_name: string;
        provider_id: number | null;
        harness: string;
    })[];
    previous: TokenUsageSummary;
    week: TokenUsageSummary;
};

/**
 * One table of the database, as the database browser lists it.
 */
export type DatabaseTableSummary = {
    name: string;
    type: "table" | "virtual";
    /**
     * How many records it holds, when it could be counted.
     */
    rows: number | null;
    /**
     * What the table's pages take on disk, when SQLite can measure it.
     */
    size_bytes: number | null;
    columns: DatabaseTableColumn[];
    key: DatabaseTableKey;
};

/**
 * One value in a record, as a cell shows it. `text` is the whole value,
 * or its first `AppData.DatabaseBrowserCellMaxChars` characters when
 * `truncated` says so.
 */
export type DatabaseCell = {
    text: string;
    kind: "text" | "number" | "blob" | "null";
    truncated: boolean;
};

/**
 * One record of a table: what identifies it, and its columns' values.
 */
export type DatabaseRecord = {
    key: string | number | null;
    cells: Record<string, DatabaseCell>;
};

/**
 * One page of a table's records.
 */
export type DatabaseRecordsPayload = {
    table: DatabaseTableSummary;
    records: DatabaseRecord[];
    total: number;
    page: number;
    page_size: number;
    /**
     * The search these records answer, so the page knows whether its pager
     * counts the table or a narrowing of it.
     */
    search: string;
    mode: DatabaseSearchMode;
};

/**
 * One record, in full, for its modal.
 */
export type DatabaseRecordPayload = {
    table: DatabaseTableSummary;
    record: DatabaseRecord | null;
};

/**
 * A folder in the files browser's picker.
 */
export type StorageSpecOption = {
    spec: { volume: StorageVolume; owner_id: number };
    label: string;
};

/**
 * A worker bot's model settings page data, also returned when it saves.
 */
/**
 * A file on a chat message, as the client shows it.
 */
export type BotMessageAttachment = {
    id: number;
    name: string;
    media_type: MediaType;
    url: string;
    thumbnail_url?: string;
    /**
     * The bot file it is, when it was saved in one of the bot's folders.
     */
    file_id?: number;
};

/**
 * An emoji reaction on a message, grouped by emoji.
 */
export type BotMessageReaction = {
    emoji: BotMessageReactionEmoji;
    count: number;
    /**
     * The session user reacted with it.
     */
    mine: boolean;
};

/**
 * The message a reply quotes, as the thread shows it.
 */
export type BotMessageReply = {
    id: number;
    author: "bot" | "user";
    text: string;
};

export type BotMessageWithAttachments = BUN_SQLITE_COBBLE_BOT_MESSAGES & {
    attachments?: BotMessageAttachment[];
    reactions?: BotMessageReaction[];
    reply_to?: BotMessageReply | null;
    /**
     * What the model calls behind this message spent (`token_usages`),
     * summed. Only on bot messages that took at least one call.
     */
    usage?: TokenUsageSummary | null;
};

/**
 * One model call behind a message, as its details modal lists it: which
 * provider and model answered, for which harness, and what it spent.
 */
export type MessageDetailsCall = {
    id: number;
    created_at: number;
    harness: string;
    provider_id: number | null;
    provider_name: string | null;
    /**
     * The provider's kind (`HarnessProviderKinds`), while the provider
     * still exists.
     */
    provider_kind: string | null;
    model_slug: string | null;
    /**
     * The catalog's display name, while the model is still in it.
     */
    model_name: string | null;
    prompt_tokens: number;
    completion_tokens: number;
    cost: number | null;
    /**
     * How it was made (`token_usages.settings`); null for a call recorded
     * before settings were.
     */
    settings: HarnessCallSettings | null;
};

/**
 * The calls of one provider, model and harness, summed: what the modal's
 * "Models" list shows.
 */
export type MessageDetailsModel = TokenUsageSummary & {
    harness: string;
    provider_name: string | null;
    provider_kind: string | null;
    model_slug: string | null;
    model_name: string | null;
    /**
     * The latest call's settings: a run keeps its settings, so they are
     * the same for every call but a fallback.
     */
    settings: HarnessCallSettings | null;
};

/**
 * The queued job that produced a message, while it is kept
 * (`BotQueueRetentionDays`).
 */
export type MessageDetailsJob = {
    id: number;
    kind: string | null;
    title: string | null;
    status: string | null;
    attempts: number;
    started_at: number | null;
    finished_at: number | null;
    /**
     * How many model turns and notes it recorded (`bots_queue.steps` once cleared, plus any `bots_queue_updates` left).
     */
    steps: number;
};

/**
 * Everything known about how one bot message was generated: the job that
 * ran it, every model call it took and their totals.
 */
export type MessageDetails = {
    message_id: number;
    created_at: number | null;
    totals: TokenUsageSummary;
    models: MessageDetailsModel[];
    /**
     * The calls in the order they were made, up to
     * `AppData.MessageDetailsMaxCalls`; `totals.calls` counts them all.
     */
    calls: MessageDetailsCall[];
    job: MessageDetailsJob | null;
};

/**
 * `server:bot-reaction` data: a message's reactions changed.
 */
/**
 * A page of a session's older messages, oldest first, and whether there
 * are older still.
 */
export type OlderBotMessagesData = {
    messages: BotMessageWithAttachments[];
    has_more: boolean;
    /**
     * The session paged, and the one it carries on from (opened above it
     * next).
     */
    session: {
        id: number;
        title: string | null;
        previous_session_id: number | null;
    };
};

export type BotMessageReactionData = {
    message_id: number;
    reactions: BotMessageReaction[];
};

export type BotHarnessOverviewPayload = {
    harnesses: HarnessOverview[];
};

/**
 * A database snapshot in the bun-sqlite backups directory (`db/.backups`).
 */
export type DbBackup = {
    name: string;
    created_at: number;
    size: number;
};

/**
 * A tar.gz archive of the whole `DATA_DIR` in `BACKUP_ARCHIVE_DIR`
 * (outside the data volume), newest first. Restoring one is an offline
 * operation: the app only creates, lists and downloads them.
 */
export type DataBackup = {
    name: string;
    created_at: number;
    size: number;
};

export type DataBackupRunKind = "archive" | "restore";

/**
 * The whole-data archive or restore this process last started
 * (`startDataBackupRun`), which the backups page polls while it runs.
 * `boot_id` changes when the process restarts, which is how the page
 * knows a restore finished.
 */
export type DataBackupRun = {
    status: "idle" | "running" | "done" | "failed";
    kind?: DataBackupRunKind;
    started_at?: number;
    finished_at?: number;
    /**
     * The archive written or restored.
     */
    name?: string;
    error?: string;
    boot_id: string;
};

export type DataBackupStatus = {
    run: DataBackupRun;
    data_backups: DataBackup[];
};

export type BotVoicePayload = {
    transcription: boolean;
    speech: boolean;
};

/**
 * The text model a conversation's bot runs on now, for its header.
 */
export type BotTextModel = {
    name: string;
    provider_name: string;
};

/**
 * A conversation's history, which its page loads on the client once it
 * renders (`grabConversationHistory`): the active session, its latest
 * messages, whether it has older ones, and the bot's active task in it.
 */
export type ConversationHistory = {
    session: BUN_SQLITE_COBBLE_BOT_SESSIONS;
    messages: BotMessageWithAttachments[];
    has_more: boolean;
    /**
     * The bot's active task in the session and what its job has done so
     * far.
     */
    task: BotTaskWithSteps | null;
    /**
     * When the session shown was carried over into a newer one (it stays
     * closed, to read): that session. Null otherwise.
     */
    moved_to_session_id: number | null;
};

/**
 * What `api/admin/bots/conversation-history` answers: the history, or
 * where to go instead when the user can't chat with the bot there any
 * more.
 */
/**
 * A conversation's active session for "Copy chat"
 * (`grabConversationExport`): its messages, oldest first, and the names of
 * the bots and workspaces they mention.
 */
export type ConversationExport = {
    bot_name: string;
    workspace_name: string | null;
    /**
     * Who the user messages are from.
     */
    user_name: string;
    /**
     * Null while the conversation has no session yet.
     */
    session: ConversationExportSession | null;
    messages: BotMessageWithAttachments[];
    /**
     * Names by id, only for what the user reaches.
     */
    ref_names: {
        bots: Record<number, string>;
        workspaces: Record<number, string>;
    };
};

export type ConversationExportSession = {
    id: number;
    title: string | null;
    created_at: number;
};

/**
 * The session a conversation page shows (`cobble:session-shown`), told to
 * the rail so it marks it.
 */
export type ShownSession = {
    bot_id: number;
    workspace_id: number | null;
    session: BUN_SQLITE_COBBLE_BOT_SESSIONS;
};

export type ConversationHistoryPayload = {
    history?: ConversationHistory;
    redirect?: string;
};

/**
 * One build's `.bunext/public` files, downloaded by the service worker
 * before the app runs (`grabPrecacheManifest`).
 */
export type PrecacheManifest = {
    build_id: string;
    files: string[];
};

export type PagePropsType = {
    user?: User | null;
    user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    person?: BUN_SQLITE_COBBLE_USERS_JOIN | null;
    persons?: BUN_SQLITE_COBBLE_USERS_JOIN[] | null;
    /**
     * The user a settings page manages, when it is not the session user
     * (`/admin/settings/users/<id>`).
     */
    target_person?: BUN_SQLITE_COBBLE_USERS_JOIN | null;
    /**
     * Every worker and workspace, to pick what a user reaches
     * (`grabCrewOptions`).
     */
    crew_bots?: BUN_SQLITE_COBBLE_BOTS[] | null;
    crew_workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[] | null;
    bots?: BotWithLastMessage[] | null;
    bot?: BotWithLastMessage | null;
    /**
     * The user's workspaces, for the rail.
     */
    workspaces?: WorkspaceWithActivity[] | null;
    /**
     * The workspace open now (its page or a conversation in it).
     */
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    /**
     * On a workspace's page: its bots, its computers (default first),
     * every computer the user has, and its models.
     */
    workspace_bots?: WorkspaceBot[] | null;
    /**
     * Every bot the user has, for adding one to a workspace.
     */
    all_bots?: BotWithLastMessage[] | null;
    workspace_computers?: ComputerWithStatus[] | null;
    computers?: ComputerWithStatus[] | null;
    /**
     * A workspace's dashboard: the user's latest sessions there.
     */
    workspace_activity?: WorkspaceActivityItem[] | null;
    /**
     * The open chatroom (`/admin/chatrooms/[chatroom_id]`) and every
     * message in it.
     */
    chatroom?: ChatroomSummary | null;
    chatroom_messages?: BUN_SQLITE_COBBLE_BOT_MESSAGES[] | null;
    /**
     * The user's chatrooms (`/admin/chatrooms`).
     */
    chatrooms?: ChatroomSummary[] | null;
    /**
     * A workspace's dashboard: its shared to-do list.
     */
    workspace_tasks?: TaskWithNames[] | null;
    /**
     * The computer a settings page manages, with its access.
     */
    computer?: ComputerWithStatus | null;
    computer_bots?: BotWithFace[] | null;
    computer_workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[] | null;
    workspace_harness_overview?: BotHarnessOverviewPayload | null;
    /**
     * The workspaces a bot works in, with what it has for each alone.
     */
    bot_workspaces?: BotWorkspace[] | null;
    /**
     * The open bot's computers, the one it's on first.
     */
    bot_computers?: ComputerWithStatus[] | null;
    /**
     * The routines page: every schedule the user's bots have.
     */
    cron_jobs?: CronJobWithNames[] | null;
    /**
     * The routines page: every hook the user gave their bots.
     */
    bot_hooks?: BotHookWithNames[] | null;
    environment?: string;
    has_password?: boolean;
    backups?: DbBackup[] | null;
    data_backups?: DataBackup[] | null;
    data_backup_run?: DataBackupRun | null;
    harness_overview?: HarnessOverviewPayload | null;
    bot_harness_overview?: BotHarnessOverviewPayload | null;
    envs_overview?: EnvsOverviewPayload | null;
    /**
     * The viewer's own personal secrets (the Secrets settings page).
     */
    personal_secrets?: PersonalSecret[] | null;
    /**
     * What bots keep on disk: the per-folder quota and its usage (the
     * General settings page).
     */
    storage_quota?: {
        setting_key: string;
        quota_mb: number;
        total_bytes: number;
        total_files: number;
        folders: number;
    } | null;
    /**
     * The install-wide text appended to every bot's prompt (the General
     * settings page).
     */
    system_prompt_append?: {
        setting_key: string;
        text: string;
    } | null;
    /**
     * Model turns a task run and a chat reply may take, with the code's
     * defaults (the General settings page).
     */
    run_limits?: {
        task_steps: number;
        reply_steps: number;
        task_default: number;
        reply_default: number;
        max: number;
    } | null;
    /**
     * The longest runbook a skill may save and how much of it a bot reads
     * at once, with the code's defaults (the General settings page).
     */
    skill_limits?: SkillLimitsOverview | null;
    /**
     * How many days hook calls are kept, with the code's default (the
     * General settings page).
     */
    hook_call_retention?: HookCallRetentionOverview | null;
    /**
     * How many days logs are kept, with the code's default (the General
     * settings page).
     */
    log_retention?: LogRetentionOverview | null;
    /**
     * How long closed chatrooms are kept and how many one place keeps, with
     * the code's defaults (the General settings page).
     */
    chatroom_retention?: ChatroomRetentionOverview | null;
    /**
     * How many messages a session takes, with the code's default (the
     * General settings page).
     */
    session_length?: SessionLengthOverview | null;
    /**
     * The name the install goes by as an installed app (Settings >
     * General, and the root's head tags). Empty when never named.
     */
    install_name?: string | null;
    /**
     * The icon the install goes by as an installed app (Settings >
     * General, and the root's icon links).
     */
    install_icon?: PwaInstallIcon | null;
    /**
     * The release the server is running, for the General settings page.
     */
    running_version?: RunningVersion | null;
    push_overview?: PushOverview | null;
    mcps_overview?: McpServersOverviewPayload | null;
    tools_overview?: CustomToolsOverviewPayload | null;
    skills_overview?: SkillsOverviewPayload | null;
    knowledgebases_overview?: KnowledgebasesOverviewPayload | null;
    bot_extensions?: BotExtensionsPayload | null;
    /**
     * The files browser's folders (a user's own crew and media, and what a
     * super admin may open) and the folder it is showing.
     */
    storage_folders?: StorageSpecOption[] | null;
    storage_folder?: StorageFolderPayload | null;
    /**
     * The database browser's tables (super admin only) and the first page
     * of the one it is showing.
     */
    database_tables?: DatabaseTableSummary[] | null;
    database_records?: DatabaseRecordsPayload | null;
    /**
     * What the install's models spent, on the usage page (crew managers
     * only).
     */
    usage?: UsageOverview | null;
    /**
     * The open conversation's files (a bot's own, or a workspace's shared
     * ones), for the files modal and the chips that name one.
     */
    bot_files?: BotFileScopesPayload | null;
    /**
     * On a graphic's own page: the graphic (never its HTML).
     */
    graphic?: BotGraphicView | null;
    /**
     * Whether the open conversation's mic (transcription) and read-aloud
     * (speech) are turned on for the bot there.
     */
    bot_voice?: BotVoicePayload | null;
    /**
     * The open conversation's text model (its header). The full model
     * settings load when the models modal opens.
     */
    bot_text_model?: BotTextModel | null;
    workspace_extensions?: BotExtensionsPayload | null;
    /**
     * The bot's own envs, or a workspace's (its settings page). Only a
     * super admin gets them: envs are theirs to set.
     */
    bot_envs?: ScopedEnvsPayload | null;
    workspace_envs?: ScopedEnvsPayload | null;
    envs?: {
        GOOGLE_CLIENT_ID?: string;
        R2_PUBLIC_DOMAIN?: string;
        PAYSTACK_PUBLIC_KEY?: string;
    };
    url?: BunextPageModuleServerReturnURLObject;
};

export type AppContextObject = {
    SITE_DATA: SITE_DATA_TYPE;
    user: User | null;
    user_types: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    appState: AppStateObject;
    setAppState: React.Dispatch<React.SetStateAction<AppStateObject>>;
    refresh?: number;
    setRefresh?: React.Dispatch<React.SetStateAction<number>>;
    pageData?: any;
    pageProps?: PagePropsType;
    query?: PageQueryObject | null;
};

export type AppDataObject = {};

export type AppStateObject = {
    data?: AppDataObject;
    likes?: string[] | null;
    currency?: CurrencyObjectType;
    fonts?: any;
    setOpenLoginModal?: React.Dispatch<React.SetStateAction<boolean>>;
    setOpenSignUpModal?: React.Dispatch<React.SetStateAction<boolean>>;
};

export type CurrencyObjectType = {
    symbol: string;
    code: string;
    multiplier?: number;
    icon?: string;
    country?: string;
    countryCode?: string;
} | null;

export type SITE_DATA_TYPE = {
    siteName?: string;
    siteSlug?: string;
    siteUrl?: string;
    currency?: CurrencyObjectType;
    currencyOptions?: CurrencyObjectType[];
    standardShippingCostInUsd?: number;
};

export type DSQL_RESPONSE = {
    success: boolean;
    payload?: Object[] | string | any[] | { error: string } | null;
};

export type DSQL_POST_QUERY_OBJECT = {
    action: string;
    table: string;
    data?: object;
    identifierColumnName?: string;
    identifierValue?: string;
    duplicateColumnName?: string;
    duplicateColumnValue?: string;
    update?: boolean;
};

export type AppApiRes = {
    success?: boolean;
    payload?: any;
    result?: any;
    msg?: string;
};

export type GithubUserObject = {
    login: string;
    id: 1;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    name: string;
    company: string;
    blog: string;
    location: string;
    email: string;
    hireable: boolean;
    bio: string;
    twitter_username: string;
    public_repos: 2;
    public_gists: 1;
    followers: 20;
    following: 0;
    created_at: string;
    updated_at: string;
    private_gists: 81;
    total_private_repos: 100;
    owned_private_repos: 100;
    disk_usage: 10000;
    collaborators: 8;
    two_factor_authentication: boolean;
    plan: {
        name: string;
        space: 400;
        private_repos: 20;
        collaborators: 0;
    };
};

export type FileBase64Object = {
    fileBase64: string;
    fileBase64Full: string;
    fileName: string;
    fileSize: number;
    fileType: string;
};

export type UserType = (typeof UserTypes)[number]["value"];

export const WebSocketEvents = [
    "resource",
    "error",
    "update",
    "ready",
    "message",
    "url",
    "success",

    /**
     * # Client Events
     * @description Events sent from Client to Server
     */
    "client:ping",

    /**
     * # Server Events
     * @description Events sent from Server to Client
     */
    "server:pong",
    /**
     * A new message in one of the user's bot conversations (`data`: the
     * `bot_messages` row)
     */
    "server:bot-message",
    /**
     * A session in one of the user's bot conversations started, was named
     * or otherwise changed (`data`: `BotSessionChangedData`)
     */
    "server:bot-session",
    /**
     * A bot joined the crew or one of the user's workspaces (`data`:
     * `BotCreatedData`)
     */
    "server:bot-created",
    /**
     * A bot the user could see was deleted (`data`: `BotRemovedData`)
     */
    "server:bot-removed",
    /**
     * A bot's face or status line changed (`data`: `BotUpdatedData`)
     */
    "server:bot-updated",
    /**
     * A workspace the user can see was created (`data`:
     * `WorkspaceCreatedData`)
     */
    "server:workspace-created",
    /**
     * A workspace the user could see was deleted (`data`:
     * `WorkspaceRemovedData`)
     */
    "server:workspace-removed",
    /**
     * A workspace the user can see changed (`data`: `WorkspaceUpdatedData`)
     */
    "server:workspace-updated",
    /**
     * A message's emoji reactions changed (`data`: `BotMessageReactionData`)
     */
    "server:bot-reaction",
    /**
     * A running job took a step (`data`: `BotJobUpdateData`)
     */
    "server:bot-job-update",
    /**
     * A new message in one of the user's chatrooms (`data`:
     * `ChatroomMessageData`)
     */
    "server:chatroom-message",
    /**
     * One of the user's chatrooms opened or changed status (`data`:
     * `ChatroomSummary`)
     */
    "server:chatroom-updated",
    /**
     * A computer's container changed state, e.g. finished setting up
     * (`data`: `ComputerWithStatus`)
     */
    "server:computer-updated",
] as const;

export type WebSocketDataType = {
    event: (typeof WebSocketEvents)[number];
    data?: any;
    error?: string;
    message?: string;
};

export type WebsocketRoomType = (typeof WebsocketRooms)[number]["value"];

export type UserAssignmentFnParams = {
    actor_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    target_user_type: UserType;
    target_user_types?: UserType[];
    action: "assign" | "delete";
    assignment_matrix?: UserTypeAssignmentMatrixType;
    deletion_matrix?: UserTypeAssignmentMatrixType;
    debug?: boolean;
};

export type UserTypeAssignmentRules = {
    all?: boolean;
    same_as?: UserType;
    allowed_targets?: UserType[];
    excluded_targets?: UserType[];
};

export type UserTypeAssignmentEntry = {
    allowed_actors?:
        | UserType[]
        | Partial<Record<UserType, UserTypeAssignmentRules>>;
    excluded_targets?: UserType[];
};

export type UserTypeAssignmentMatrixType = Record<
    UserType,
    UserTypeAssignmentEntry
>;

/**
 * The type-matrix shapes, for any set of types (`BotTypeAssignmentMatrix`,
 * `BotTypeTargetMatrix`). Actors may be user types or bot types.
 */
export type TypeAssignmentRules<A extends string = string> = {
    all?: boolean;
    same_as?: A;
    allowed_targets?: string[];
    excluded_targets?: string[];
};

export type TypeAssignmentEntry<A extends string = string> = {
    allowed_actors?: A[] | Partial<Record<A, TypeAssignmentRules<A>>>;
    excluded_targets?: string[];
};

export type TypeAssignmentMatrixType<
    T extends string,
    A extends string = string,
> = Record<T, TypeAssignmentEntry<A>>;

export type BotType = (typeof BotTypes)[number]["value"];

/**
 * What a bot is where it works: its kind, or a type it holds there.
 */
export type BotRole = BotKind | BotType;

export type BotPermission = (typeof BotPermissions)[number]["value"];

export type LoginFormObject = {
    username_or_email?: string;
    password?: string;
};

export type SignupFormObject = {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
};

export type PasswordFormObject = {
    current_password?: string;
    new_password?: string;
    confirm_password?: string;
};

export type ContactFormObject = {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
};

export type ApiReqParams<
    T extends BUN_SQLITE_COBBLE_ALL_TYPEDEFS = BUN_SQLITE_COBBLE_ALL_TYPEDEFS,
> = {
    login?: {
        email?: string;
        email_or_username?: string;
        password?: string;
    };
    signup?: {
        first_name?: string;
        last_name?: string;
        username?: string;
        email?: string;
        password?: string;
    };
    password_update?: {
        current_password?: string;
        new_password?: string;
    };
    new_password?: string;
    google_token?: string;
    contact?: {
        name?: string;
        email?: string;
        subject?: string;
        message?: string;
    };
    image_url?: string;
    sql_query?: ServerQueryParam<T>;
    sql_select_params?: any;
    sql_insert_params?: any;
    count?: boolean;
    insert_data?: BUN_SQLITE_COBBLE_ALL_TYPEDEFS[];
    update_data?: BUN_SQLITE_COBBLE_ALL_TYPEDEFS;
    update_on_duplicate?: boolean;
    user_id?: string | number | null;
    dependent_id?: string | number | null;

    media_base_64?: string;
    media_base_64_data_url?: string;
    media_paradigms?: MediaParadigmType[];
    media_paradigm?: MediaParadigmType;
    media_type?: (typeof MediaTypes)[number]["value"];
    media_name?: string;

    is_media_primary?: boolean;
    reauth?: boolean;
    search_terms?: string[];
    amount?: number;
    id?: string | number;
    ids?: (string | number)[];
    paystack_payment_reference?: string;
    target_user_type?: UserType;
    page?: number;
    /**
     * Search Terms
     */
    search_term_first_name?: string | string[];
    search_term_last_name?: string | string[];
    search_term_email?: string | string[];
    search_term_id?: string | string[];
    search_term_user_type?: string | string[];

    text?: string;
    media?: BUN_SQLITE_COBBLE_MEDIA;
    backup_name?: string;
};

export type GoogleCredentialResponse = {
    credential?: string;
};

export type GoogleWindow = globalThis.Window & {
    google?: {
        accounts?: {
            id?: {
                initialize: (params: {
                    client_id: string;
                    callback: (response: GoogleCredentialResponse) => void;
                }) => void;
                renderButton: (
                    parent: HTMLElement,
                    options: Record<string, string | number | boolean>,
                ) => void;
            };
        };
    };
};

export type UserAuthReturn = {
    success: boolean;
    msg?: string;
    user?: User | null;
    user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
};

export type SQLInsertGenValueType =
    | string
    | number
    | Float32Array<ArrayBuffer>
    | Buffer<ArrayBuffer>
    | null;

export type MediaType = (typeof MediaTypes)[number]["value"];
export type MediaParadigm = (typeof MediaParadigms)[number]["value"];

export type TableType = (typeof BunSQLiteTables)[number];

export type AdminCrudAPIParams = {
    table: TableType;
    id?: string | number;
    user: User;
    user_types: BUN_SQLITE_COBBLE_USER_TYPES[];
    body?: ApiReqParams;
    query?: ApiReqParams;
    req: Request;
};

export type ClientAdminCrudParams<
    T extends BUN_SQLITE_COBBLE_ALL_TYPEDEFS = BUN_SQLITE_COBBLE_ALL_TYPEDEFS,
> = {
    action: "get" | "insert" | "update" | "delete";
    table: TableType;
    id?: string | number;
    sql_query?: ServerQueryParam<T>;
    sql_select_params?: any;
    sql_insert_params?: any;
    count?: boolean;
    insert_data?: T[];
    update_data?: T;
    update_on_duplicate?: boolean;
    request_query?: ApiReqParams<T>;
    request_body?: ApiReqParams<T>;
};

export type AdminFetchParams<T extends {} = BUN_SQLITE_COBBLE_ALL_TYPEDEFS> = {
    url: string;
    query?: ApiReqParams<T>;
    body?: ApiReqParams<T>;
    method?: "PUT" | "DELETE" | "POST" | "GET";
};

export type UserFormObject = BUN_SQLITE_COBBLE_USERS & {
    user_types?: UserType[];
    password?: string;
    confirm_password?: string;
};

export type PageQueryObject = {
    user_id?: string;
    bot_id?: string;
    workspace_id?: string;
    chatroom_id?: string;
    computer_id?: string;
    event_id?: string;
    user_type?: UserType;
};

export type MediaParadigmType = (typeof MediaParadigms)[number]["value"];

export type AddEventFormMediaObject = BUN_SQLITE_COBBLE_MEDIA &
    ImageInputToBase64FunctionReturn;

export type MediaDataType =
    | Blob
    | File
    | NodeJS.TypedArray
    | ArrayBufferLike
    | string
    | Bun.BlobPart[]
    | Bun.Archive
    | ReadableStream
    | Request
    | Response;

export type FeatureItem = {
    Icon: LucideIcon;
    title: string;
    description: string;
};

/**
 * One device with push notifications on, as Settings lists it. Never the
 * endpoint: that is a capability URL held by the browser.
 */
export type PushDeviceOverview = {
    id: number;
    device: string;
    created_at: number;
    last_used_at: number;
    last_error: string | null;
};

export type PushOverview = {
    /**
     * The install's VAPID public key, which a subscribing browser needs.
     */
    public_key: string | null;
    subscriptions: PushDeviceOverview[];
};
