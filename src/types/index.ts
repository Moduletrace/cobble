import type {
    BUN_SQLITE_COBBLE_ALL_TYPEDEFS,
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_BOT_TASK_STEPS,
    BUN_SQLITE_COBBLE_BOT_TASKS,
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_USER_TYPES,
    BUN_SQLITE_COBBLE_USERS,
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
 * A bot row plus its latest message, for the rail.
 */
export type BotWithLastMessage = BUN_SQLITE_COBBLE_BOTS & {
    last_message_text?: string | null;
    last_message_at?: number | null;
};

/**
 * The task shown in the working-on panel, with its ordered steps.
 */
export type BotTaskWithSteps = BUN_SQLITE_COBBLE_BOT_TASKS & {
    steps: BUN_SQLITE_COBBLE_BOT_TASK_STEPS[];
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
    bots?: BotWithLastMessage[] | null;
    bot?: BotWithLastMessage | null;
    bot_messages?: BUN_SQLITE_COBBLE_BOT_MESSAGES[] | null;
    bot_task?: BotTaskWithSteps | null;
    environment?: string;
    has_password?: boolean;
    backups?: DbBackup[] | null;
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
     * A bot's face or status line changed (`data`: `{ id, face, status_line }`)
     */
    "server:bot-updated",
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
};

export type PageQueryObject = {
    user_id?: string;
    bot_id?: string;
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
