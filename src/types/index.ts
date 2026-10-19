import type {
    BUN_SQLITE_COBBLE_ALL_TYPEDEFS,
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_BOT_SESSIONS,
    BUN_SQLITE_COBBLE_BOT_TASK_STEPS,
    BUN_SQLITE_COBBLE_BOT_TASKS,
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES,
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_CRON_JOBS,
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_USER_TYPES,
    BUN_SQLITE_COBBLE_USERS,
    BUN_SQLITE_COBBLE_WORKSPACES,
    BunSQLiteTables,
} from "@/db/types/db";
import type { UserTypes } from "../dict/user-types-dict";
import type { WebsocketRooms } from "../dict/websocket-rooms";
import type { LucideIcon } from "lucide-react";
import type { ServerQueryParam } from "@moduletrace/bun-sqlite";
import type { MediaParadigms, MediaTypes } from "../dict/media-dict";
import type { BunextPageModuleServerReturnURLObject } from "@moduletrace/bunext/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "./sql-joins";
import type { ImageInputToBase64FunctionReturn } from "@moduletrace/twui/utils/form/imageInputToBase64";
import type { HarnessKind } from "../dict/harness-dict";
import type { HarnessProviderKind } from "../dict/harness-provider-dict";
import type { EnvParadigm, KnownEnv } from "../dict/env-dict";
import type { ContainerStatus } from "../dict/computer-dict";

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
 * A bot row plus its conversation (in its own chat or one workspace):
 * unread, latest activity and latest message, for the rail.
 */
export type BotWithLastMessage = BUN_SQLITE_COBBLE_BOTS & {
    unread?: number | null;
    last_activity_at?: number | null;
    last_message_text?: string | null;
    last_message_at?: number | null;
};

/**
 * A bot's schedule with what the routines page shows beside it: the bot
 * and the workspace it runs in.
 */
export type CronJobWithNames = BUN_SQLITE_COBBLE_CRON_JOBS & {
    bot_name?: string | null;
    bot_kind?: string | null;
    bot_hue?: string | null;
    bot_face?: string | null;
    bot_image_media_id?: number | null;
    workspace_name?: string | null;
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
 * A workspace a bot works in, with what the bot has for that workspace
 * alone.
 */
export type BotWorkspace = WorkspaceWithActivity & {
    workspace_system_prompt?: string | null;
    workspace_memory?: string | null;
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
 * `server:bot-created` data: a bot the user can now see, the workspaces
 * it's in, and whether it belongs in their own chat list (the main rail).
 */
export type BotCreatedData = {
    bot: BotWithLastMessage;
    workspace_ids: number[];
    in_own_chat: boolean;
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
    face: BUN_SQLITE_COBBLE_BOTS["face"];
    status_line: string;
    task: BotTaskWithSteps | null;
    /**
     * The computer the bot is on, when the push knows it (a switch, or the
     * live relay). Null means its main one.
     */
    computer_id?: number | null;
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
    secret: boolean;
    expose_to_computers: boolean;
    value?: string;
    /**
     * An `EnvDict` key the app itself reads.
     */
    known: boolean;
};

/**
 * Somewhere envs can be set: general, or one of the user's workspaces or
 * computers.
 */
export type EnvScope = {
    paradigm: EnvParadigm;
    id: number | null;
    title: string;
};

/**
 * An app setting on the Environment page: whether it's saved, or comes
 * from the server's environment instead.
 */
export type KnownEnvStatus = KnownEnv & {
    saved: boolean;
    from_process: boolean;
};

export type EnvsOverviewPayload = {
    scopes: EnvScope[];
    envs: PublicEnv[];
    known: KnownEnvStatus[];
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
};

export type BotMessageWithAttachments = BUN_SQLITE_COBBLE_BOT_MESSAGES & {
    attachments?: BotMessageAttachment[];
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
    bot_messages?: BotMessageWithAttachments[] | null;
    /**
     * The open conversation's active session.
     */
    bot_session?: BUN_SQLITE_COBBLE_BOT_SESSIONS | null;
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
     * The open bot's active task and what its job has done so far.
     */
    bot_task?: BotTaskWithSteps | null;
    /**
     * The routines page: every schedule the user's bots have.
     */
    cron_jobs?: CronJobWithNames[] | null;
    environment?: string;
    has_password?: boolean;
    backups?: DbBackup[] | null;
    harness_overview?: HarnessOverviewPayload | null;
    bot_harness_overview?: BotHarnessOverviewPayload | null;
    envs_overview?: EnvsOverviewPayload | null;
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
     * A running job took a step (`data`: `BotJobUpdateData`)
     */
    "server:bot-job-update",
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
    is_media_private?: boolean;

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
    return_media_text_content?: boolean;
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
    bot_ids?: number[];
    workspace_ids?: number[];
    password?: string;
    confirm_password?: string;
};

export type PageQueryObject = {
    user_id?: string;
    bot_id?: string;
    workspace_id?: string;
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
