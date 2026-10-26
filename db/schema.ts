import { LogCategories } from "@/src/dict/log-categories";
import { BotTypes } from "@/src/dict/bot-types-dict";
import { MediaParadigms, MediaTypes } from "@/src/dict/media-dict";
import {
    BotFaces,
    BotHues,
    BotKinds,
    BotMessageAuthors,
    BotSessionStatuses,
    BotStoneShapes,
    BotTaskStatuses,
    BotTaskStepStates,
} from "@/src/dict/bot-dict";
import {
    ComputerKinds,
    ContainerPurposes,
    ContainerStatuses,
} from "@/src/dict/computer-dict";
import { Harnesses } from "@/src/dict/harness-dict";
import { HarnessProviderKinds } from "@/src/dict/harness-provider-dict";
import { BotJobKinds, BotJobUpdateKinds } from "@/src/dict/bot-queue-dict";
import { AppData } from "@/src/data/app-data";
import {
    BotHookEventStatuses,
    BotHookSignatureFormats,
    BotHookSources,
    HookProposalActions,
} from "@/src/dict/bot-hook-dict";
import { ExtensionProposalStatuses } from "@/src/dict/extension-proposal-dict";
import {
    BotFilePurposes,
    BotFileScopes,
    BotFileSources,
} from "@/src/dict/bot-file-dict";
import type { BUN_SQLITE_DatabaseSchemaType } from "@moduletrace/bun-sqlite/types";
import { EnvParadigms, SecretRequestStatuses } from "@/src/dict/env-dict";
import { McpServerStatuses, McpTransports } from "@/src/dict/mcp-dict";
import {
    CustomToolKinds,
    CustomToolStatuses,
} from "@/src/dict/custom-tool-dict";
import {
    TaskAuthors,
    TaskMediaKinds,
    TaskOrigins,
    TaskStatuses,
} from "@/src/dict/task-dict";

const schema: BUN_SQLITE_DatabaseSchemaType = {
    tables: [
        {
            tableName: "users",
            fields: [
                {
                    fieldName: "first_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "last_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "email",
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "username",
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "bio",
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
            ],
        },
        {
            tableName: "user_types",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "user_type",
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_user_types_user_id_user_type",
                    indexTableFields: ["user_id", "user_type"],
                },
            ],
        },
        {
            tableName: "sso_login_codes",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    unique: true,
                },
                {
                    fieldName: "code",
                    dataType: "TEXT",
                },
            ],
        },
        {
            tableName: "user_passwords",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    unique: true,
                },
                {
                    fieldName: "password_hash",
                    dataType: "TEXT",
                },
            ],
        },
        {
            tableName: "media",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "summary",
                    dataType: "TEXT",
                },
                {
                    fieldName: "media_type",
                    dataType: "TEXT",
                    options: MediaTypes.map((it) => it.value),
                },
                {
                    fieldName: "media_write_path",
                    dataType: "TEXT",
                },
                {
                    fieldName: "media_thumbnail_write_path",
                    dataType: "TEXT",
                },
                {
                    fieldName: "mime_type",
                    dataType: "TEXT",
                },
                {
                    fieldName: "text_content",
                    dataType: "TEXT",
                    fieldDescription: `For text content only. Raw binary text is not allowed.`,
                },
                {
                    fieldName: "is_primary",
                    dataType: "INTEGER",
                    options: [0, 1],
                },
                {
                    fieldName: "is_rag_ingested",
                    dataType: "INTEGER",
                    options: [0, 1],
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_user_per_primary_profile_image",
                    constraintName: "One User per primary profile image",
                    constraintTableFields: [
                        { value: "user_id" },
                        { value: "is_primary" },
                    ],
                },
            ],
        },
        {
            tableName: "media_paradigms",
            fields: [
                {
                    fieldName: "media_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "media",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "media_paradigm_media_fk",
                    },
                },
                {
                    fieldName: "media_paradigm",
                    dataType: "TEXT",
                    options: MediaParadigms.map((mp) => mp.value),
                },
            ],
            indexes: [
                {
                    indexName: "idx_media_paradigms_media_id",
                    indexTableFields: ["media_id"],
                },
            ],
        },
        {
            tableName: "bots",
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `Who created the bot. Not a foreign key, and not access: bots belong to the install, reached through \`bot_users\` and \`workspace_users\``,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "kind",
                    fieldDescription: `Worker or the one coordinator (which only the super admin sees and reaches). \`bot_types\` add to it`,
                    dataType: "TEXT",
                    options: BotKinds.map((bk) => bk.value),
                    defaultValue: "worker",
                },
                {
                    fieldName: "color",
                    fieldDescription: `The bot's identity colour, a \`#rrggbb\` string. Null for the coordinator, which stays hue-less`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "stone",
                    fieldDescription: `Which flat-cut stone the bot renders in its colour. The shape no longer follows the colour`,
                    dataType: "TEXT",
                    options: BotStoneShapes.map((bs) => bs.value),
                    defaultValue: "ember",
                },
                {
                    fieldName: "hue",
                    fieldDescription: `Historical: the palette hue from before \`color\` and \`stone\`. Only read as a fallback for a bot saved before them, and backfilled by \`move-bot-colour-to-owners\``,
                    dataType: "TEXT",
                    options: BotHues.map((bh) => bh.value),
                },
                {
                    fieldName: "role",
                    fieldDescription: `The bot's job in one line. Null for the coordinator`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "system_prompt",
                    fieldDescription: `The bot's core instructions, in markdown. The bot can rewrite it`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "memory",
                    fieldDescription: `What the bot must always remember, in markdown, the same for every user it works with: never about one user (that's \`bot_user_memories\`). The bot keeps it up to date`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "computer_id",
                    fieldDescription: `The computer the bot works on in its own chat. Not a foreign key: null, or a computer it lost access to, means its main one. In a workspace it works on the workspace's computer`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "image_media_id",
                    fieldDescription: `A custom picture (a private \`media\` row, paradigm \`bot-image\`) shown instead of the stone. The hue still applies. Not a foreign key: a missing row means the stone`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bots_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "bot_sessions",
            tableDescription: `A stretch of one user's conversation with a bot: in its own chat (no workspace) or in one workspace. Every user has their own. Only the active session's messages go to the model; closed ones can be searched and reopened`,
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `The user the conversation is with: only they see it, and the bot's runs in it work for them`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_session_user_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_session_bot_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace the conversation is in. Null: the bot's own chat`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_session_workspace_fk",
                    },
                },
                {
                    fieldName: "title",
                    fieldDescription: `Written by the bot from the session's first exchange`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "summary",
                    fieldDescription: `What happened in the session (markdown), written by the bot and refreshed as it goes, then carried into the next one`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "summary_message_count",
                    fieldDescription: `How many of the session's messages the summary covers, so a stale one is rewritten before it's carried into the next session`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "previous_session_id",
                    fieldDescription: `The session this one carries on from (its summary goes into the prompt). Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "status",
                    fieldDescription: `One active session per conversation`,
                    dataType: "TEXT",
                    options: BotSessionStatuses.map((s) => s.value),
                    defaultValue: "active",
                },
                {
                    fieldName: "unread",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "last_activity_at",
                    fieldDescription: `Unix timestamp of the latest message, for ordering`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_sessions_bot_id_workspace_id",
                    indexTableFields: ["bot_id", "workspace_id", "status"],
                },
                {
                    indexName: "idx_bot_sessions_workspace_id",
                    indexTableFields: ["workspace_id"],
                },
                {
                    indexName: "idx_bot_sessions_user_id",
                    indexTableFields: [
                        "user_id",
                        "bot_id",
                        "workspace_id",
                        "status",
                    ],
                },
            ],
        },
        {
            tableName: "bot_messages",
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_bot_fk",
                    },
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The session the message is in`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_sessions",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_session_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The session's workspace, kept here to route the message without a join. Null: the bot's own chat`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_workspace_fk",
                    },
                },
                {
                    fieldName: "author",
                    dataType: "TEXT",
                    options: BotMessageAuthors.map((bma) => bma.value),
                },
                {
                    fieldName: "text",
                    dataType: "TEXT",
                },
                {
                    fieldName: "needs_you",
                    fieldDescription: `Renders the Needs you chip under the message`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "interim",
                    fieldDescription: `Sent mid-reply with send_message (an acknowledgement, a heads-up): the bot is still working on the reply, so the thinking row stays up while its face is working`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "reply_to_message_id",
                    fieldDescription: `The message this one replies to, quoted above it. Not a foreign key, so deleting the quoted message only drops the quote`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "tool_log",
                    fieldDescription: `JSON \`[{ name, ok }]\`: every tool call the run behind a bot message made (names only, never arguments), told to the bot with the message in later turns so it can't build on work it never did. Null: not recorded (user messages, interim ones, older messages)`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "carried_from_session_id",
                    fieldDescription: `Set on the message that opens a session the bot moved the conversation into (\`continue_in_new_session\`): the session it carries on from, whose summary is the message's text. Not a foreign key`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_messages_bot_id_created_at",
                    indexTableFields: ["bot_id", "created_at"],
                },
                {
                    indexName: "idx_bot_messages_session_id_created_at",
                    indexTableFields: ["session_id", "created_at"],
                },
                {
                    indexName: "idx_bot_messages_reply_to_message_id",
                    indexTableFields: ["reply_to_message_id"],
                },
            ],
        },
        {
            tableName: "bot_message_reactions",
            tableDescription: `Emoji reactions on chat messages, one per user and emoji`,
            fields: [
                {
                    fieldName: "message_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_messages",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_reaction_message_fk",
                    },
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `The user who reacted. Null for a bot's own reaction`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_reaction_user_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that reacted. Null for a user's reaction`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_reaction_bot_fk",
                    },
                },
                {
                    fieldName: "emoji",
                    fieldDescription: `One of BotMessageReactions`,
                    dataType: "TEXT",
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_reaction_per_message_user_emoji",
                    constraintName:
                        "A user reacts to a message once with the same emoji",
                    constraintTableFields: [
                        { value: "message_id" },
                        { value: "user_id" },
                        { value: "emoji" },
                    ],
                },
                {
                    alias: "one_reaction_per_message_bot_emoji",
                    constraintName:
                        "A bot reacts to a message once with the same emoji",
                    constraintTableFields: [
                        { value: "message_id" },
                        { value: "bot_id" },
                        { value: "emoji" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_message_reactions_message_id",
                    indexTableFields: ["message_id"],
                },
            ],
        },
        {
            tableName: "bot_tasks",
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_task_bot_fk",
                    },
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The session the task was started from; its result is posted there`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_sessions",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_task_session_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The session's workspace. Null: the bot's own chat`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_task_workspace_fk",
                    },
                },
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: BotTaskStatuses.map((bts) => bts.value),
                    defaultValue: "active",
                },
                {
                    fieldName: "computer_url",
                    fieldDescription: `"Open computer" target`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_tasks_bot_id_status",
                    indexTableFields: ["bot_id", "status"],
                },
            ],
        },
        {
            tableName: "bot_task_steps",
            fields: [
                {
                    fieldName: "task_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_tasks",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_task_step_task_fk",
                    },
                },
                {
                    fieldName: "label",
                    dataType: "TEXT",
                },
                {
                    fieldName: "state",
                    dataType: "TEXT",
                    options: BotTaskStepStates.map((btss) => btss.value),
                    defaultValue: "pending",
                },
                {
                    fieldName: "position",
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_task_steps_task_id",
                    indexTableFields: ["task_id"],
                },
            ],
        },
        {
            tableName: "tasks",
            tableDescription: `The crew's to-do list: work that is tracked until it's done, one collection per bot and one per workspace (exactly one of \`bot_id\` and \`workspace_id\` is set). A workspace's tasks are visible to every bot working there and to the coordinator; the coordinator reaches every task. Not the same thing as \`bot_tasks\` or \`bots_queue\`: those record a queued job, this records the work`,
            fields: [
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot the task belongs to; null for a workspace's task`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "tasks_bot_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace the task belongs to (its bots all see it); null for a bot's own`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "tasks_workspace_fk",
                    },
                },
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "description",
                    fieldDescription: `The brief (markdown): what to do, where, and how you'll know it's done`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: TaskStatuses.map((ts) => ts.value),
                    defaultValue: "todo",
                },
                {
                    fieldName: "blocked_reason",
                    fieldDescription: `What the user has to do to unblock it; only meaningful while \`status\` is blocked`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "origin",
                    fieldDescription: `Whether the user added it by hand or a bot created it`,
                    dataType: "TEXT",
                    options: TaskOrigins.map((to) => to.value),
                    defaultValue: "user",
                },
                {
                    fieldName: "created_by_bot_id",
                    fieldDescription: `The bot that created it, when a bot did. Not a foreign key: the task stays if the bot goes`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "created_by_user_id",
                    fieldDescription: `The user who created it by hand, or whose run created it. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "completed_at",
                    fieldDescription: `Unix ms when it was done or cancelled; null while it's open`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_tasks_bot_id_status",
                    indexTableFields: ["bot_id", "status"],
                },
                {
                    indexName: "idx_tasks_workspace_id_status",
                    indexTableFields: ["workspace_id", "status"],
                },
            ],
        },
        {
            tableName: "task_media",
            tableDescription: `A file linked to a task: the deliverable it produced, or something it needs to do the work. The bytes are a private \`media\` row (paradigm \`task-media\`), served at \`/media/<id>\` to whoever reaches the task`,
            fields: [
                {
                    fieldName: "task_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "tasks",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "task_media_task_fk",
                    },
                },
                {
                    fieldName: "media_id",
                    fieldDescription: `The private \`media\` row holding the bytes`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "media",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "task_media_media_fk",
                    },
                },
                {
                    fieldName: "bot_file_id",
                    fieldDescription: `The \`bot_files\` row the bytes came from, when they live in a bot's or workspace's folder. Not a foreign key: the file's own cleanup handles its bytes`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "kind",
                    fieldDescription: `What the file is for: a deliverable the task produced, or a reference it works from`,
                    dataType: "TEXT",
                    options: TaskMediaKinds.map((tmk) => tmk.value),
                    defaultValue: "deliverable",
                },
                {
                    fieldName: "name",
                    fieldDescription: `The name shown to the user`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "added_by_bot_id",
                    fieldDescription: `The bot that linked it, when a bot did. Not a foreign key`,
                    dataType: "INTEGER",
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_link_per_task_media",
                    constraintName: "A file is linked to a task once",
                    constraintTableFields: [
                        { value: "task_id" },
                        { value: "media_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_task_media_task_id",
                    indexTableFields: ["task_id"],
                },
                {
                    indexName: "idx_task_media_media_id",
                    indexTableFields: ["media_id"],
                },
            ],
        },
        {
            tableName: "task_notes",
            tableDescription: `A task's progress log: what the user or a bot did or found, oldest first. A note is how a bot keeps the user up to date between status changes`,
            fields: [
                {
                    fieldName: "task_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "tasks",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "task_note_task_fk",
                    },
                },
                {
                    fieldName: "author",
                    dataType: "TEXT",
                    options: TaskAuthors.map((ta) => ta.value),
                    defaultValue: "bot",
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that wrote it, when a bot did. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "text",
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_task_notes_task_id",
                    indexTableFields: ["task_id"],
                },
            ],
        },
        {
            tableName: "bots_queue",
            isQueue: {
                maxAttempts: AppData.BotQueueMaxAttempts,
                lockTimeout: AppData.BotQueueLockTimeoutMs,
                backoff: AppData.BotQueueBackoffMs,
            },
            fields: [
                {
                    fieldName: "kind",
                    fieldDescription: `task (long-running work, shown in the working-on panel) or reply (answers the user in chat)`,
                    dataType: "TEXT",
                    options: BotJobKinds.map((k) => k.value),
                    defaultValue: "task",
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot doing the work`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bots_queue_bot_fk",
                    },
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The session the result is posted in`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_sessions",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bots_queue_session_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The session's workspace: its context, computers and models apply. Null: the bot's own chat`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bots_queue_workspace_fk",
                    },
                },
                {
                    fieldName: "message_id",
                    fieldDescription: `The user message that asked for the work, if any`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_messages",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bots_queue_message_fk",
                    },
                },
                {
                    fieldName: "task_id",
                    fieldDescription: `The task shown in the working-on panel, if any`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_tasks",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bots_queue_task_fk",
                    },
                },
                {
                    fieldName: "computer_id",
                    fieldDescription: `The computer to run on, if any. Checked against the bot's access when queued`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "requested_by_bot_id",
                    fieldDescription: `The bot that handed this job over (the coordinator, through delegate_task). It gets the result or failure in its own conversation. Not a foreign key, so the job outlives it`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "requested_by_session_id",
                    fieldDescription: `The requesting bot's session the job was handed over from. The report goes to that conversation's active session. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "title",
                    fieldDescription: `Short label for the job`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "instructions",
                    fieldDescription: `The brief the bot wrote for itself, in markdown`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "params",
                    fieldDescription: `Structured parameters the handler needs`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "progress",
                    fieldDescription: `Latest progress note from the bot, in markdown`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "checkpoint",
                    fieldDescription: `State to resume from if the job is picked up again`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "result",
                    fieldDescription: `What the bot reported when it finished, in markdown`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "started_at",
                    fieldDescription: `Unix timestamp of the first claim`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "finished_at",
                    fieldDescription: `Unix timestamp of completion or final failure`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bots_queue_bot_id_status",
                    indexTableFields: ["bot_id", "status"],
                },
            ],
        },
        {
            tableName: "bots_queue_updates",
            tableDescription: `What a bot did while working through a queued job, one row per step, oldest first. Live in the working-on panel while the job runs; deleted with the job when it's pruned`,
            fields: [
                {
                    fieldName: "bots_queue_id",
                    fieldDescription: `The job`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots_queue",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bots_queue_update_job_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot doing the work (the job's), to read a bot's updates without a join`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bots_queue_update_bot_fk",
                    },
                },
                {
                    fieldName: "kind",
                    fieldDescription: `tool (the bot called tools) or note (it wrote something without calling one)`,
                    dataType: "TEXT",
                    options: BotJobUpdateKinds.map((k) => k.value),
                },
                {
                    fieldName: "text",
                    fieldDescription: `The update in one line, e.g. "Using sandbox_execute_bash"`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "metadata",
                    fieldDescription: `JSON details: the step index, tool names, the model`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bots_queue_updates_job_created_at",
                    indexTableFields: ["bots_queue_id", "created_at"],
                },
            ],
        },
        {
            tableName: "cron_jobs",
            tableDescription: `A bot's schedules (routines in the UI): a brief queued as a task on a cron schedule, in UTC. The \`run-cron-jobs\` cron queues the due ones every minute`,
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `The owner`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "cron_jobs_user_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that runs it`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "cron_jobs_bot_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace it runs in (context, computers, models, and the conversation its results go to); null for the bot's own chat`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "cron_jobs_workspace_fk",
                    },
                },
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "instructions",
                    fieldDescription: `The brief each run gets (markdown), like a task's`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "schedule",
                    fieldDescription: `A Bun.cron expression (5 fields or a nickname like @daily), in UTC`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "computer_id",
                    fieldDescription: `The computer its runs use; null for the bot's current one when it runs. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "enabled",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "max_runs",
                    fieldDescription: `Turns itself off after this many runs (1 for a one-off); null runs until stopped`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "run_count",
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
                {
                    fieldName: "next_run_at",
                    fieldDescription: `Unix ms of the next run; null once it can't run again`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "last_run_at",
                    fieldDescription: `Unix ms of the last run queued`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "last_job_id",
                    fieldDescription: `The \`bots_queue\` job of the last run. Not a foreign key: finished jobs are pruned`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "last_error",
                    fieldDescription: `Why the last run couldn't be queued or was skipped; cleared by the next run`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_cron_jobs_enabled_next_run_at",
                    indexTableFields: ["enabled", "next_run_at"],
                },
                {
                    indexName: "idx_cron_jobs_bot_id",
                    indexTableFields: ["bot_id"],
                },
                {
                    indexName: "idx_cron_jobs_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "bot_hooks",
            tableDescription: `A bot's hooks: a secret URL an outside service (a webhook, a script) calls to queue a task for the bot, its brief plus the call's payload. Like a routine, it belongs to one user and runs as them`,
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `The owner; runs act as them, with their memory and reach`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_hooks_user_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that runs it`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_hooks_bot_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace it runs in (context, computers, models, and the conversation its results go to); null for the bot's own chat`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_hooks_workspace_fk",
                    },
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The session (of this user, bot and place) its runs and results land in, open or closed; null follows the conversation's active session. A bot's proposed hook gets the session it was proposed in. Not a foreign key: a missing one is replaced by a new session on the next call`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "instructions",
                    fieldDescription: `The brief each run gets (markdown); the call's payload is added below it as data`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "computer_id",
                    fieldDescription: `The computer its runs use; null for the bot's current one when it runs. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "source",
                    fieldDescription: `What calls it: \`url\` (an outside service) or \`browser_notifications\` (the watcher on \`watch_computer_id\`)`,
                    dataType: "TEXT",
                    options: BotHookSources.map((s) => s.value),
                    defaultValue: "url",
                },
                {
                    fieldName: "watch_computer_id",
                    fieldDescription: `For browser notifications: the computer whose notifications it gets. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "watch_filter",
                    fieldDescription: `For browser notifications: only the ones whose site, title or text contains this (any case); empty takes all`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "watch_token",
                    fieldDescription: `For browser notifications: the token, encrypted, so the app can give the computer's watcher its URL again after the container is recreated`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "token_prefix",
                    fieldDescription: `The token's first characters, to find the hook a call names. The token itself is never stored`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "token_hash",
                    fieldDescription: `SHA-256 (hex) of the whole token, compared in constant time`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "signing_secret",
                    fieldDescription: `Encrypted HMAC-SHA256 secret; when set, every call must be signed with it`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "signature_header",
                    fieldDescription: `The request header carrying the signature, e.g. X-Hub-Signature-256`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "signature_format",
                    dataType: "TEXT",
                    options: BotHookSignatureFormats.map((f) => f.value),
                },
                {
                    fieldName: "enabled",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "run_count",
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
                {
                    fieldName: "last_called_at",
                    fieldDescription: `Unix ms of the last call taken`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "last_job_id",
                    fieldDescription: `The \`bots_queue\` job of the last run. Not a foreign key: finished jobs are pruned`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "last_error",
                    fieldDescription: `Why the last call couldn't run or the last run failed; cleared by the next run`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_hooks_token_prefix",
                    indexTableFields: ["token_prefix"],
                },
                {
                    indexName: "idx_bot_hooks_bot_id",
                    indexTableFields: ["bot_id"],
                },
                {
                    indexName: "idx_bot_hooks_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "bot_hook_events",
            tableDescription: `Every call to a bot's hook and what became of it, for the hook's recent calls. Pruned after \`AppData.BotHookEventsKeepDays\``,
            fields: [
                {
                    fieldName: "hook_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_hooks",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_hook_events_hook_fk",
                    },
                },
                {
                    fieldName: "job_id",
                    fieldDescription: `The \`bots_queue\` job it went to. Not a foreign key: finished jobs are pruned`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "payload",
                    fieldDescription: `The body as received, cut to \`AppData.BotHookMaxPayloadBytes\``,
                    dataType: "TEXT",
                },
                {
                    fieldName: "content_type",
                    dataType: "TEXT",
                },
                {
                    fieldName: "source_ip",
                    dataType: "TEXT",
                },
                {
                    fieldName: "idempotency_key",
                    fieldDescription: `The sender's delivery id, so a retried call runs once`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: BotHookEventStatuses.map((s) => s.value),
                },
                {
                    fieldName: "error",
                    dataType: "TEXT",
                },
                {
                    fieldName: "response",
                    fieldDescription: `What its run answered (the result the bot posted), or why the run failed. Written when the run ends, on every call that run took in`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "response_message_id",
                    fieldDescription: `The chat message the run posted. Not a foreign key: messages can be deleted`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "responded_at",
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_hook_events_hook_id_created_at",
                    indexTableFields: ["hook_id", "created_at"],
                },
                {
                    indexName: "idx_bot_hook_events_hook_id_idempotency_key",
                    indexTableFields: ["hook_id", "idempotency_key"],
                },
                {
                    indexName: "idx_bot_hook_events_job_id",
                    indexTableFields: ["job_id"],
                },
            ],
        },
        {
            tableName: "hook_proposals",
            tableDescription: `A hook a bot proposed making, or a change to one (its name, brief, filter, or switching it back on), waiting for the user whose conversation it was proposed in to confirm or reject it from its card. Nothing is saved until they confirm; a new hook's URL is shown to them then, never to the bot`,
            fields: [
                {
                    fieldName: "action",
                    fieldDescription: `create (a new hook in the conversation it was proposed in) or change (\`hook_id\`)`,
                    dataType: "TEXT",
                    options: HookProposalActions.map((a) => a.value),
                },
                {
                    fieldName: "hook_id",
                    fieldDescription: `The hook it changes, null for a new one. Not a foreign key: a deleted one makes the proposal fail on confirm`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "title",
                    fieldDescription: `The hook's name (the new one when renaming), for the chip`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "data",
                    fieldDescription: `JSON: what would be saved (HookProposalData): for a new hook all of it, for a change only the fields that change`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "reason",
                    fieldDescription: `Why the bot proposes it, in its own words, shown on the card as such`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: [...ExtensionProposalStatuses],
                    defaultValue: "pending",
                },
                {
                    fieldName: "outcome",
                    fieldDescription: `What happened on confirm, or why it failed. Never the hook's URL`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "result_id",
                    fieldDescription: `The hook it saved, once confirmed`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "expires_at",
                    fieldDescription: `A pending proposal can't be confirmed after this (Unix ms)`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "decided_at",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `The user it was proposed to, who alone reads and decides it; the hook would be theirs. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that proposed it, which runs the hook. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The conversation it was proposed in. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The session's workspace, where a new hook runs; null for the bot's own chat. Not a foreign key`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_hook_proposals_session_id",
                    indexTableFields: ["session_id"],
                },
            ],
        },
        {
            tableName: "secret_requests",
            tableDescription: `A secret (a password, token or key) a bot asked a user for in their conversation. The user types it into the request's card, never into the chat, so the model never sees it: it's saved as their personal env (paradigm user) for that bot, which reaches that user's runs on computers by key`,
            fields: [
                {
                    fieldName: "key",
                    fieldDescription: `The env key it's saved under`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "description",
                    fieldDescription: `What it is, saved as the env's description`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "reason",
                    fieldDescription: `Why the bot asks, in its own words, shown on the card as such`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: [...SecretRequestStatuses],
                    defaultValue: "pending",
                },
                {
                    fieldName: "env_id",
                    fieldDescription: `The env it saved, once saved. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "decided_at",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `The user it was asked of, who alone answers it. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that asked, whose runs for that user get it. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The conversation it was asked in. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The session's workspace; null for the bot's own chat. Not a foreign key`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_secret_requests_session_id",
                    indexTableFields: ["session_id"],
                },
            ],
        },
        {
            tableName: "workspaces",
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `Who created the workspace. Not a foreign key, and not access: workspaces belong to the install, reached through \`workspace_users\``,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "system_prompt",
                    fieldDescription: `Shared context in markdown, in the prompt of every bot working in the workspace`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "computer_id",
                    fieldDescription: `The default computer: where the workspace's tasks run. Set to the first computer linked; null when none is. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "image_media_id",
                    fieldDescription: `The workspace's picture (a private \`media\` row, paradigm \`workspace-image\`). Not a foreign key: a missing row means the default icon`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
            ],
            indexes: [
                {
                    indexName: "idx_workspaces_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "workspace_bots",
            fields: [
                {
                    fieldName: "workspace_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_bot_workspace_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_bot_bot_fk",
                    },
                },
                {
                    fieldName: "system_prompt",
                    fieldDescription: `The bot's instructions for this workspace (markdown), after the workspace's own. The bot, the coordinator and the user can rewrite them`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "memory",
                    fieldDescription: `What the bot must remember in this workspace (markdown), after its core memory`,
                    dataType: "TEXT",
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_bot_per_workspace",
                    constraintName: "A bot joins a workspace once",
                    constraintTableFields: [
                        { value: "workspace_id" },
                        { value: "bot_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_workspace_bots_bot_id",
                    indexTableFields: ["bot_id"],
                },
            ],
        },
        {
            tableName: "bot_types",
            tableDescription: `Types a bot holds on top of its \`kind\`, like \`user_types\` for users (\`BotTypePermissionMatrix\`): each row holds in one workspace (a workspace admin). A bot with no row is just its kind. One per bot, type and workspace, enforced in \`setBotType\``,
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_types_bot_fk",
                    },
                },
                {
                    fieldName: "bot_type",
                    dataType: "TEXT",
                    options: BotTypes.map((bt) => bt.value),
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace the type holds in`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_types_workspace_fk",
                    },
                },
                {
                    fieldName: "granted_by_user_id",
                    fieldDescription: `The user who granted it (or for whom the granting bot ran). Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "granted_by_bot_id",
                    fieldDescription: `The bot that granted it from chat (the coordinator), if any. Not a foreign key`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_types_bot_id_workspace_id",
                    indexTableFields: ["bot_id", "workspace_id"],
                },
                {
                    indexName: "idx_bot_types_workspace_id",
                    indexTableFields: ["workspace_id"],
                },
            ],
        },
        {
            tableName: "workspace_users",
            tableDescription: `Users added to a workspace (by a super admin or admin): they chat with every worker in it there`,
            fields: [
                {
                    fieldName: "workspace_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_users_workspace_fk",
                    },
                },
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_users_user_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_user_per_workspace",
                    constraintName: "A user joins a workspace once",
                    constraintTableFields: [
                        { value: "workspace_id" },
                        { value: "user_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_workspace_users_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "bot_users",
            tableDescription: `Worker bots assigned to a user (by a super admin or admin): the user chats with the bot in its own chat. Nobody but the super admin reaches the coordinator`,
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_users_bot_fk",
                    },
                },
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_users_user_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_user_per_bot",
                    constraintName: "A bot is assigned to a user once",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "user_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_users_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "bot_user_memories",
            tableDescription: `What a bot remembers about one user (markdown). Only that user's runs see it, the way a workspace's memory stays in the workspace`,
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_user_memory_bot_fk",
                    },
                },
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_user_memory_user_fk",
                    },
                },
                {
                    fieldName: "memory",
                    fieldDescription: `What the bot must remember about this user (markdown), after its core memory. The bot keeps it up to date`,
                    dataType: "TEXT",
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_memory_per_bot_user",
                    constraintName: "A bot has one memory per user",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "user_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_user_memories_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "bot_user_faces",
            tableDescription: `A bot's face (its status) and status line as one user sees it, set by the bot's jobs in that user's conversations. No row means idle. Other users never see it, so "needs you" only shows to the user it's for`,
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_user_face_bot_fk",
                    },
                },
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_user_face_user_fk",
                    },
                },
                {
                    fieldName: "face",
                    fieldDescription: `The bot's status for this user, shown as its face`,
                    dataType: "TEXT",
                    options: BotFaces.map((bf) => bf.value),
                    defaultValue: "idle",
                },
                {
                    fieldName: "status_line",
                    fieldDescription: `Short status sentence, e.g. "Waiting on you"`,
                    dataType: "TEXT",
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_face_per_bot_user",
                    constraintName: "A bot has one face per user",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "user_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_user_faces_user_id",
                    indexTableFields: ["user_id"],
                },
                {
                    indexName: "idx_bot_user_faces_updated_at",
                    indexTableFields: ["updated_at"],
                },
            ],
        },
        {
            tableName: "bot_message_media",
            tableDescription: `Files attached to a chat message (\`media\` rows, private to the message's owner)`,
            fields: [
                {
                    fieldName: "message_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_messages",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_media_message_fk",
                    },
                },
                {
                    fieldName: "media_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "media",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_message_media_media_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_link_per_message_media",
                    constraintName: "A file is attached to a message once",
                    constraintTableFields: [
                        { value: "message_id" },
                        { value: "media_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_message_media_message_id",
                    indexTableFields: ["message_id"],
                },
            ],
        },
        {
            tableName: "containers",
            fields: [
                {
                    fieldName: "name",
                    fieldDescription: `Docker container name, also its hostname on the network`,
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "docker_id",
                    fieldDescription: `Docker container id, once known`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "purpose",
                    dataType: "TEXT",
                    options: ContainerPurposes.map((cp) => cp.value),
                    defaultValue: "computer",
                },
                {
                    fieldName: "image",
                    fieldDescription: `Image the container runs, e.g. ghcr.io/agent-infra/sandbox:latest`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "network",
                    fieldDescription: `Docker network shared with the main container`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "hostname",
                    fieldDescription: `Address the main container reaches it on`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "ip_address",
                    fieldDescription: `Its IP address on the network, tried when the hostname can't be reached (a dev server outside docker)`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "port",
                    fieldDescription: `Port the service listens on inside the container`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "status",
                    fieldDescription: `Last known docker state`,
                    dataType: "TEXT",
                    options: ContainerStatuses.map((cs) => cs.value),
                    defaultValue: "unknown",
                },
                {
                    fieldName: "metadata",
                    fieldDescription: `Extra docker details (ports, volumes, env names, labels)`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "last_seen_at",
                    fieldDescription: `Unix timestamp of the last docker inspect`,
                    dataType: "INTEGER",
                },
            ],
        },
        {
            tableName: "computers",
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `Who created the computer. Not a foreign key, and not access: computers belong to the install, reached through the bots that use them`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "container_id",
                    fieldDescription: `The container this computer runs in`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "containers",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "computer_container_fk",
                    },
                },
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "kind",
                    fieldDescription: `One main computer per owner; everything else is a sandbox`,
                    dataType: "TEXT",
                    options: ComputerKinds.map((ck) => ck.value),
                    defaultValue: "sandbox",
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "cpus",
                    fieldDescription: `CPU cores the container may use (docker NanoCpus), set when the computer is created`,
                    dataType: "REAL",
                },
                {
                    fieldName: "memory_mb",
                    fieldDescription: `Memory limit of the container in MB, set when the computer is created`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_computers_user_id_kind",
                    indexTableFields: ["user_id", "kind"],
                },
                {
                    indexName: "idx_computers_container_id",
                    indexTableFields: ["container_id"],
                },
            ],
        },
        {
            tableName: "bot_computers",
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_computer_bot_fk",
                    },
                },
                {
                    fieldName: "computer_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "computers",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_computer_computer_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_access_per_bot_computer",
                    constraintName: "A bot gets access to a computer once",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "computer_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_computers_computer_id",
                    indexTableFields: ["computer_id"],
                },
            ],
        },
        {
            tableName: "workspace_computers",
            fields: [
                {
                    fieldName: "workspace_id",
                    fieldDescription: `Every bot in this workspace gets access to the computer`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_computer_workspace_fk",
                    },
                },
                {
                    fieldName: "computer_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "computers",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_computer_computer_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_computer_per_workspace",
                    constraintName: "A computer joins a workspace once",
                    constraintTableFields: [
                        { value: "workspace_id" },
                        { value: "computer_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_workspace_computers_computer_id",
                    indexTableFields: ["computer_id"],
                },
            ],
        },
        {
            tableName: "harness_providers",
            fields: [
                {
                    fieldName: "kind",
                    fieldDescription: `Which provider preset this is`,
                    dataType: "TEXT",
                    options: HarnessProviderKinds.map((hpk) => hpk.value),
                },
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "base_url",
                    fieldDescription: `API base URL, e.g. https://openrouter.ai/api/v1`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "api_key",
                    fieldDescription: `API key, encrypted with ENCRYPTION_KEY. Never sent to the client`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "enabled",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "last_synced_at",
                    fieldDescription: `Unix timestamp of the last model list sync`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "sync_error",
                    fieldDescription: `Why the last model list sync failed, if it did`,
                    dataType: "TEXT",
                },
            ],
        },
        {
            tableName: "harness_models",
            fields: [
                {
                    fieldName: "provider_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "harness_providers",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "harness_model_provider_fk",
                    },
                },
                {
                    fieldName: "slug",
                    fieldDescription: `The provider's model id, e.g. deepseek/deepseek-v4.1-flash:free`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "free",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "available",
                    fieldDescription: `0 once the provider stops listing it`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "input_modalities",
                    fieldDescription: `JSON array, e.g. ["text","image"]`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "output_modalities",
                    fieldDescription: `JSON array, e.g. ["text"], ["speech"], ["image"]`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "supports_tools",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "context_length",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "max_output_tokens",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "voices",
                    fieldDescription: `JSON array of voice names, for speech models`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "supported_parameters",
                    fieldDescription: `JSON array of the request fields the model takes (OpenRouter's supported_parameters), so only the generation settings it honors are offered`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "intelligence_score",
                    fieldDescription: `Artificial Analysis intelligence index`,
                    dataType: "REAL",
                },
                {
                    fieldName: "agentic_score",
                    fieldDescription: `Artificial Analysis agentic index`,
                    dataType: "REAL",
                },
                {
                    fieldName: "released_at",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "expires_at",
                    fieldDescription: `When the provider retires the model`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "last_seen_at",
                    fieldDescription: `Unix timestamp of the last sync that listed it`,
                    dataType: "INTEGER",
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_model_slug_per_provider",
                    constraintName: "A provider lists a model once",
                    constraintTableFields: [
                        { value: "provider_id" },
                        { value: "slug" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_harness_models_free_available",
                    indexTableFields: ["free", "available"],
                },
            ],
        },
        {
            tableName: "harness_settings",
            fields: [
                {
                    fieldName: "harness",
                    dataType: "TEXT",
                    options: Harnesses.map((h) => h.value),
                    unique: true,
                },
                {
                    fieldName: "model_id",
                    fieldDescription: `harness_models row picked by a super admin. Null picks automatically. Not a foreign key, so removing a provider leaves the setting`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "provider_id",
                    fieldDescription: `harness_providers row this harness is limited to (its pick and automatic picks). Null: any provider. Not a foreign key; removing the provider clears it`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "fallback",
                    fieldDescription: `When the picked model fails, try the automatic picks`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "enabled",
                    fieldDescription: `0 turns the harness off. Text is always on`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "options",
                    fieldDescription: `Harness options, e.g. {"voice":"george"} for speech`,
                    dataType: "TEXT",
                    json: true,
                },
            ],
        },
        {
            tableName: "bot_harness_settings",
            fields: [
                {
                    fieldName: "bot_id",
                    fieldDescription: `The worker bot that overrides the default. The coordinator always uses the defaults`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_harness_settings_bot_fk",
                    },
                },
                {
                    fieldName: "harness",
                    dataType: "TEXT",
                    options: Harnesses.map((h) => h.value),
                },
                {
                    fieldName: "model_id",
                    fieldDescription: `harness_models row picked for this bot. Null picks automatically. Not a foreign key, like harness_settings`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "provider_id",
                    fieldDescription: `harness_providers row this bot's harness is limited to. Null: any provider. Not a foreign key, like harness_settings`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "fallback",
                    fieldDescription: `When the picked model fails, try the automatic picks`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "enabled",
                    fieldDescription: `0 turns the harness off for this bot. Text is always on`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "options",
                    fieldDescription: `Harness options, e.g. {"voice":"george"} for speech`,
                    dataType: "TEXT",
                    json: true,
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_setting_per_bot_harness",
                    constraintName: "A bot overrides a harness once",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "harness" },
                    ],
                },
            ],
        },
        {
            tableName: "workspace_harness_settings",
            tableDescription: `A workspace's models. They win over the bot's own and the defaults for every run in the workspace`,
            fields: [
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName:
                            "workspace_harness_settings_workspace_fk",
                    },
                },
                {
                    fieldName: "harness",
                    dataType: "TEXT",
                    options: Harnesses.map((h) => h.value),
                },
                {
                    fieldName: "model_id",
                    fieldDescription: `harness_models row picked for this workspace. Null picks automatically. Not a foreign key, like harness_settings`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "provider_id",
                    fieldDescription: `harness_providers row this workspace's harness is limited to. Null: any provider. Not a foreign key, like harness_settings`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "fallback",
                    fieldDescription: `When the picked model fails, try the automatic picks`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "enabled",
                    fieldDescription: `0 turns the harness off in this workspace. Text is always on`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "options",
                    fieldDescription: `Harness options, e.g. {"voice":"george"} for speech`,
                    dataType: "TEXT",
                    json: true,
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_setting_per_workspace_harness",
                    constraintName: "A workspace overrides a harness once",
                    constraintTableFields: [
                        { value: "workspace_id" },
                        { value: "harness" },
                    ],
                },
            ],
        },
        {
            tableName: "mcp_servers",
            tableDescription: `MCP servers bots can use (Settings, under MCPs). Per bot (bot_mcp_servers), per workspace (workspace_mcp_servers) or every bot (all_bots). Private: headers and env may hold literal secrets`,
            fields: [
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "slug",
                    fieldDescription: `Prefixes its tools' names (<slug>__<tool>). Unique`,
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "transport",
                    dataType: "TEXT",
                    options: McpTransports.map((t) => t.value),
                    defaultValue: "remote",
                },
                {
                    fieldName: "url",
                    fieldDescription: `remote: the server's MCP endpoint`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "headers",
                    fieldDescription: `remote: request headers, {"Authorization":"Bearer {{env.KEY}}"}. Values are templates`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "command",
                    fieldDescription: `stdio: the command that starts the server, run with the host's shell in DATA_DIR/mcp/<id>`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "setup_command",
                    fieldDescription: `stdio: installs what the command needs. Runs before the first start and again whenever it changes`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "env",
                    fieldDescription: `stdio: the only environment the server gets (besides PATH and HOME), {"GITHUB_TOKEN":"{{env.GITHUB_TOKEN}}"}. Values are templates`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "excluded_tools",
                    fieldDescription: `Tool names (the server's own) bots don't get`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "tools_cache",
                    fieldDescription: `The server's tools as last listed ([{name, description, input_schema}]). Runs build their tools from it and connect on the first call`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "all_bots",
                    fieldDescription: `1 gives it to every bot, the coordinator included`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "enabled",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: McpServerStatuses.map((s) => s.value),
                    defaultValue: "untested",
                },
                {
                    fieldName: "last_error",
                    dataType: "TEXT",
                },
                {
                    fieldName: "last_synced_at",
                    fieldDescription: `Unix ms of the last tool listing`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `Who created it. Not a foreign key: it belongs to the install`,
                    dataType: "INTEGER",
                },
            ],
        },
        {
            tableName: "custom_tools",
            tableDescription: `Tools bots can call (Settings, under Tools): an HTTP request, a script on a computer, or a prompt. Per bot (bot_custom_tools), per workspace (workspace_custom_tools) or every bot (all_bots)`,
            fields: [
                {
                    fieldName: "name",
                    fieldDescription: `What the model calls it: snake_case, unique, never a built-in tool's name`,
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "description",
                    fieldDescription: `What the model reads to decide when to call it`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "kind",
                    dataType: "TEXT",
                    options: CustomToolKinds.map((k) => k.value),
                },
                {
                    fieldName: "parameters",
                    fieldDescription: `JSON schema (an object) of its arguments`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "config",
                    fieldDescription: `Per kind. http: {method, url, headers, body, timeout_ms}; script: {language, code, timeout_ms}; prompt: {prompt}. Text fields are templates ({{args.x}}, {{env.KEY}})`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "all_bots",
                    fieldDescription: `1 gives it to every bot, the coordinator included`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "enabled",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "status",
                    fieldDescription: `How its last run went (a bot's call or a try). Reset to untested when it's edited`,
                    dataType: "TEXT",
                    options: CustomToolStatuses.map((s) => s.value),
                    defaultValue: "untested",
                },
                {
                    fieldName: "last_error",
                    dataType: "TEXT",
                },
                {
                    fieldName: "last_checked_at",
                    fieldDescription: `Unix ms of its last run`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `Who created it. Not a foreign key: it belongs to the install`,
                    dataType: "INTEGER",
                },
            ],
        },
        {
            tableName: "skills",
            tableDescription: `Runbooks bots follow (Settings, under Skills). A bot sees each one's name and description and reads the whole body only when it loads it with load_skill. Per bot (bot_skills), per workspace (workspace_skills) or every bot (all_bots)`,
            fields: [
                {
                    fieldName: "name",
                    fieldDescription: `What the settings page calls it, e.g. "Weekly SEO report"`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "slug",
                    fieldDescription: `What a bot passes to load_skill: lowercase letters, numbers and hyphens. Unique`,
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "description",
                    fieldDescription: `The one line a bot reads to decide whether the skill applies`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "body",
                    fieldDescription: `The runbook itself, markdown. Read only when a bot loads the skill`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "all_bots",
                    fieldDescription: `1 gives it to every bot, the coordinator included`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "enabled",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `Who created it. Not a foreign key: it belongs to the install`,
                    dataType: "INTEGER",
                },
            ],
        },
        {
            tableName: "extension_proposals",
            tableDescription: `An MCP server, custom tool or skill the coordinator proposed adding or changing, waiting for the super admin to confirm or reject it from the chat. Nothing is saved, connected or run until they confirm: the card shows where it sends, which envs it reads (saved or missing), for a skill what its runbook tells bots to do and what changed, and the bot's background check`,
            fields: [
                {
                    fieldName: "kind",
                    fieldDescription: `mcp (a remote MCP server), tool (a custom tool) or skill (a runbook)`,
                    dataType: "TEXT",
                    options: ["mcp", "tool", "skill"],
                },
                {
                    fieldName: "extension_id",
                    fieldDescription: `The server or tool it changes, null for a new one. Not a foreign key: a deleted one makes the proposal fail on confirm`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "name",
                    fieldDescription: `The server's or tool's name, for the chip`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "data",
                    fieldDescription: `JSON: the whole server, tool or skill as it would be saved (SaveMcpServerRequest, SaveCustomToolRequest or SaveSkillRequest)`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "research",
                    fieldDescription: `The bot's background check, markdown: who publishes it, whether it's official, what it needs`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "sources",
                    fieldDescription: `JSON array of the URLs the background check read`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: ["pending", "confirmed", "rejected", "replaced", "failed"],
                    defaultValue: "pending",
                },
                {
                    fieldName: "outcome",
                    fieldDescription: `What happened on confirm (saved, connected, keys missing) or why it failed`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "result_id",
                    fieldDescription: `The server or tool it saved, once confirmed`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "expires_at",
                    fieldDescription: `A pending proposal can't be confirmed after this (Unix ms)`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "decided_at",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `The super admin whose conversation it was proposed in`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that proposed it (the coordinator). Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The conversation it was proposed in, where the outcome is reported. Not a foreign key`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The session's workspace, null for the bot's own chat. Not a foreign key`,
                    dataType: "INTEGER",
                },
            ],
        },
        {
            tableName: "bot_mcp_servers",
            tableDescription: `A bot that gets an MCP server's tools everywhere it works`,
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_mcp_servers_bots_fk",
                    },
                },
                {
                    fieldName: "mcp_server_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "mcp_servers",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_mcp_servers_mcp_servers_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_mcp_server_per_bot",
                    constraintName: "A bot gets an MCP server once",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "mcp_server_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_mcp_servers_mcp_server_id",
                    indexTableFields: ["mcp_server_id"],
                },
            ],
        },
        {
            tableName: "workspace_mcp_servers",
            tableDescription: `Every bot in the workspace gets the MCP server's tools there`,
            fields: [
                {
                    fieldName: "workspace_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_mcp_servers_workspaces_fk",
                    },
                },
                {
                    fieldName: "mcp_server_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "mcp_servers",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_mcp_servers_mcp_servers_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_mcp_server_per_workspace",
                    constraintName: "A workspace gets an MCP server once",
                    constraintTableFields: [
                        { value: "workspace_id" },
                        { value: "mcp_server_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_workspace_mcp_servers_mcp_server_id",
                    indexTableFields: ["mcp_server_id"],
                },
            ],
        },
        {
            tableName: "bot_custom_tools",
            tableDescription: `A bot that gets a custom tool everywhere it works`,
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_custom_tools_bots_fk",
                    },
                },
                {
                    fieldName: "custom_tool_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "custom_tools",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_custom_tools_custom_tools_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_custom_tool_per_bot",
                    constraintName: "A bot gets a custom tool once",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "custom_tool_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_custom_tools_custom_tool_id",
                    indexTableFields: ["custom_tool_id"],
                },
            ],
        },
        {
            tableName: "workspace_custom_tools",
            tableDescription: `Every bot in the workspace gets the custom tool there`,
            fields: [
                {
                    fieldName: "workspace_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_custom_tools_workspaces_fk",
                    },
                },
                {
                    fieldName: "custom_tool_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "custom_tools",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName:
                            "workspace_custom_tools_custom_tools_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_custom_tool_per_workspace",
                    constraintName: "A workspace gets a custom tool once",
                    constraintTableFields: [
                        { value: "workspace_id" },
                        { value: "custom_tool_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_workspace_custom_tools_custom_tool_id",
                    indexTableFields: ["custom_tool_id"],
                },
            ],
        },
        {
            tableName: "bot_skills",
            tableDescription: `A bot that gets a skill everywhere it works`,
            fields: [
                {
                    fieldName: "bot_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_skills_bots_fk",
                    },
                },
                {
                    fieldName: "skill_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "skills",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_skills_skills_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_skill_per_bot",
                    constraintName: "A bot gets a skill once",
                    constraintTableFields: [
                        { value: "bot_id" },
                        { value: "skill_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_skills_skill_id",
                    indexTableFields: ["skill_id"],
                },
            ],
        },
        {
            tableName: "workspace_skills",
            tableDescription: `Every bot in the workspace gets the skill there`,
            fields: [
                {
                    fieldName: "workspace_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_skills_workspaces_fk",
                    },
                },
                {
                    fieldName: "skill_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "skills",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_skills_skills_fk",
                    },
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_skill_per_workspace",
                    constraintName: "A workspace gets a skill once",
                    constraintTableFields: [
                        { value: "workspace_id" },
                        { value: "skill_id" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_workspace_skills_skill_id",
                    indexTableFields: ["skill_id"],
                },
            ],
        },
        {
            tableName: "logs",
            fields: [
                {
                    fieldName: "title",
                    fieldDescription: `Log title used for searching and identification`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "category",
                    fieldDescription: `Log category used for filtering`,
                    dataType: "TEXT",
                    options: LogCategories.map((lc) => lc.value),
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `User who triggered the action, if any`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "plain_text",
                    fieldDescription: `Plain text version of the log, full-text searchable`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "markdown",
                    fieldDescription: `Markdown version of the log for formatted viewing`,
                    dataType: "TEXT",
                    markdown: true,
                },
                {
                    fieldName: "html",
                    fieldDescription: `HTML version of the log for frontend rendering`,
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "metadata",
                    fieldDescription: `Extra structured log data (ids, values, errors)`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "ip_address",
                    fieldDescription: `Client IP address that triggered the action, if any`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_logs_title",
                    indexTableFields: ["title"],
                },
                {
                    indexName: "idx_logs_category_created_at",
                    indexTableFields: ["category", "created_at"],
                },
                {
                    indexName: "idx_logs_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "user_presence",
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `The user. One row each`,
                    dataType: "INTEGER",
                    unique: true,
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "user_presence_user_fk",
                    },
                },
                {
                    fieldName: "last_seen_at",
                    fieldDescription: `Unix timestamp of the last open socket or keepalive, for skipping push notifications while the app is open`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_user_presence_last_seen_at",
                    indexTableFields: ["last_seen_at"],
                },
            ],
        },
        {
            tableName: "push_subscriptions",
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `The user the device belongs to`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "push_subscriptions_user_fk",
                    },
                },
                {
                    fieldName: "endpoint",
                    fieldDescription: `The push service URL the browser gave. Unique: one device, one row`,
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "p256dh",
                    fieldDescription: `The subscription's public key`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "auth",
                    fieldDescription: `The subscription's auth secret`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "user_agent",
                    fieldDescription: `What the device said it was, for the settings list`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "platform",
                    fieldDescription: `The browser's platform, for the settings list`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "last_used_at",
                    fieldDescription: `Unix timestamp of the last notification sent to it`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "last_error",
                    fieldDescription: `Why the last send failed, if it did`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_push_subscriptions_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
        {
            tableName: "envs",
            fields: [
                {
                    fieldName: "key",
                    fieldDescription: `Variable name. One per key and scope (enforced in saveEnv: SQLite unique constraints treat NULL ids as distinct)`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "value",
                    fieldDescription: `Encrypted env value.`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                    fieldDescription: `Env description. Can be searched. Bots see it beside the key, never the value`,
                },
                {
                    fieldName: "paradigm",
                    fieldDescription: `Where it applies: general, a workspace, a computer, a single bot, or one user's runs of one bot (user, set from the chat). A user's own beats the bot's, which beats the computer, which beats the workspace, which beats general`,
                    dataType: "TEXT",
                    options: EnvParadigms.map((p) => p.value),
                    defaultValue: "general",
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace, for paradigm workspace`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "envs_workspace_fk",
                    },
                },
                {
                    fieldName: "computer_id",
                    fieldDescription: `The computer, for paradigm computer`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "computers",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "envs_computer_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot, for paradigm bot or user. Goes with the bot`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "envs_bot_fk",
                    },
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `The user, for paradigm user: only their runs of \`bot_id\` get it, and only they may reveal it. Goes with the user`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "envs_user_fk",
                    },
                },
                {
                    fieldName: "secret",
                    fieldDescription: `1 hides the value once saved (only replaced, never shown) and redacts it from everything bots read`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
                {
                    fieldName: "expose_to_computers",
                    fieldDescription: `1 puts it in the shell of every computer it applies to. App settings (EnvDict) never are`,
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 1,
                },
            ],
            indexes: [
                {
                    indexName: "idx_envs_paradigm_key",
                    indexTableFields: ["paradigm", "key"],
                },
            ],
        },
        {
            tableName: "bot_files",
            tableDescription: `A file a bot saved or the user gave it: the catalog row for bytes on the data volume, under \`DATA_DIR/bots/<id>\` or \`DATA_DIR/workspaces/<id>\`. The bytes are a private \`media\` row (paradigm \`bot-file\`), so they're served like other media and deleted with the row. Never on a computer's filesystem`,
            fields: [
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot that wrote or received it. Goes with the bot`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_files_bot_fk",
                    },
                },
                {
                    fieldName: "scope",
                    fieldDescription: `Which directory it's in: a bot's own or a workspace's shared one`,
                    dataType: "TEXT",
                    options: BotFileScopes.map((s) => s.value),
                    defaultValue: "bot",
                },
                {
                    fieldName: "owner_id",
                    fieldDescription: `The bot id (scope bot) or workspace id (scope workspace) owning the directory. Not a foreign key, so a row outlives a workspace but its files are cleaned up with it`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "media_id",
                    fieldDescription: `The private \`media\` row holding the bytes. Not a foreign key: the catalog row can outlive it (a failed cleanup) and is then listed as missing`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "path",
                    fieldDescription: `Path inside the directory, forward slashes, e.g. reports/q3.md`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "folder",
                    fieldDescription: `The folder part of \`path\`, empty at the top`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "mime_type",
                    dataType: "TEXT",
                },
                {
                    fieldName: "media_type",
                    dataType: "TEXT",
                    options: MediaTypes.map((it) => it.value),
                },
                {
                    fieldName: "size",
                    fieldDescription: `Bytes on disk`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "purpose",
                    fieldDescription: `What it is for: an upload, something the bot wrote, a generated image or PDF`,
                    dataType: "TEXT",
                    options: BotFilePurposes.map((p) => p.value),
                    defaultValue: "writing",
                },
                {
                    fieldName: "source",
                    fieldDescription: `How it got here: the user attached it to a message, the bot wrote it, or a tool made it`,
                    dataType: "TEXT",
                    options: BotFileSources.map((s) => s.value),
                    defaultValue: "bot-write",
                },
                {
                    fieldName: "ingested_at",
                    fieldDescription: `When its text was chunked and embedded. Null: not ingested (yet)`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "ingest_error",
                    fieldDescription: `Why the last ingestion failed, when it did`,
                    dataType: "TEXT",
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_file_per_path",
                    constraintName: "One file per directory and path",
                    constraintTableFields: [
                        { value: "scope" },
                        { value: "owner_id" },
                        { value: "path" },
                    ],
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_files_owner",
                    indexTableFields: ["scope", "owner_id", "folder"],
                },
                {
                    indexName: "idx_bot_files_media_id",
                    indexTableFields: ["media_id"],
                },
            ],
        },
        {
            tableName: "bot_file_chunks",
            tableDescription: `A piece of a bot file's text, the unit a search returns. Replaced whole when the file is ingested again`,
            fields: [
                {
                    fieldName: "file_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_files",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_file_chunks_file_fk",
                    },
                },
                {
                    fieldName: "scope",
                    dataType: "TEXT",
                    options: BotFileScopes.map((s) => s.value),
                },
                {
                    fieldName: "owner_id",
                    fieldDescription: `The bot or workspace the file belongs to, so a search filters without a join`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "chunk_index",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "text",
                    dataType: "TEXT",
                },
                {
                    fieldName: "token_estimate",
                    fieldDescription: `A rough count (characters / 4), for trimming results`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_bot_file_chunks_file_id",
                    indexTableFields: ["file_id", "chunk_index"],
                },
                {
                    indexName: "idx_bot_file_chunks_owner",
                    indexTableFields: ["scope", "owner_id"],
                },
            ],
        },
        {
            tableName: "token_usages",
            tableDescription: `One model call that reported its usage: the tokens it spent, on which model and provider, for whom and for what. A bot message's total is the sum of the calls it took; the usage page sums them by model, provider and period`,
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `Whose work it was: the user whose conversation the call ran for`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "token_usage_user_fk",
                    },
                },
                {
                    fieldName: "bot_id",
                    fieldDescription: `The bot it was for, when it was for one`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "token_usage_bot_fk",
                    },
                },
                {
                    fieldName: "workspace_id",
                    fieldDescription: `The workspace the call was in; null for a bot's own chat`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "workspaces",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "token_usage_workspace_fk",
                    },
                },
                {
                    fieldName: "session_id",
                    fieldDescription: `The conversation it was in`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_sessions",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "token_usage_session_fk",
                    },
                },
                {
                    fieldName: "message_id",
                    fieldDescription: `The message it produced, so the thread can show what an answer cost. Null for calls that produce no message (naming a session, embedding a file)`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bot_messages",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "token_usage_message_fk",
                    },
                },
                {
                    fieldName: "job_id",
                    fieldDescription: `The queued job it ran for, when it ran for one`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "bots_queue",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "token_usage_job_fk",
                    },
                },
                {
                    fieldName: "harness",
                    fieldDescription: `What the model was used for: a chat turn, reading media, transcribing, speaking, making an image, embedding`,
                    dataType: "TEXT",
                    options: Harnesses.map((h) => h.value),
                },
                {
                    fieldName: "provider_id",
                    fieldDescription: `The provider that served it. Not a foreign key: it stays readable after the provider is deleted`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "provider_name",
                    fieldDescription: `The provider's name as it was, so a deleted provider still reads`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "model_id",
                    fieldDescription: `The catalog row of the model. Not a foreign key: a model the provider stops listing still counts`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "model_slug",
                    fieldDescription: `The provider's model id, as it was called`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "prompt_tokens",
                    fieldDescription: `Tokens sent: the prompt, the system instructions and the tool results`,
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
                {
                    fieldName: "completion_tokens",
                    fieldDescription: `Tokens written back: the answer, its tool calls and its reasoning`,
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
                {
                    fieldName: "cost",
                    fieldDescription: `The provider's price in USD, when it reports one`,
                    dataType: "REAL",
                },
                {
                    fieldName: "settings",
                    fieldDescription: `JSON (\`HarnessCallSettings\`): how the call was made. The generation settings sent (temperature, reasoning effort, max tokens, voice), where they came from, whether the model was picked or automatic, and the models that failed before it`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_token_usages_created_at",
                    indexTableFields: ["created_at"],
                },
                {
                    indexName: "idx_token_usages_message_id",
                    indexTableFields: ["message_id"],
                },
                {
                    indexName: "idx_token_usages_provider_model",
                    indexTableFields: ["provider_id", "model_slug"],
                },
                {
                    indexName: "idx_token_usages_user_created_at",
                    indexTableFields: ["user_id", "created_at"],
                },
                {
                    indexName: "idx_token_usages_bot_created_at",
                    indexTableFields: ["bot_id", "created_at"],
                },
            ],
        },
        {
            tableName: "bot_file_vectors",
            tableDescription: `sqlite-vec vectors of a file's chunks, at \`AppData.EmbeddingDimensions\` wide whatever the model returns. A vec0 table is only recreated with \`bunx bun-sqlite schema --vector\`, so the entrypoint never passes it`,
            isVector: true,
            vectorType: "vec0",
            fields: [
                {
                    fieldName: "embedding",
                    fieldDescription: `Normalized, padded or cut to \`AppData.EmbeddingDimensions\``,
                    dataType: "BLOB",
                    isVector: true,
                    vectorSize: AppData.EmbeddingDimensions,
                },
                {
                    fieldName: "chunk_id",
                    dataType: "INTEGER",
                    sideCar: true,
                },
                {
                    fieldName: "file_id",
                    dataType: "INTEGER",
                    sideCar: true,
                },
                {
                    fieldName: "scope",
                    dataType: "TEXT",
                    sideCar: true,
                },
                {
                    fieldName: "owner_id",
                    dataType: "INTEGER",
                    sideCar: true,
                },
            ],
        },
        {
            tableName: "file_ingest_queue",
            tableDescription: `Files waiting to have their text chunked and embedded. A queue, so a restart never strands a file and an upload never waits on a model. A finished job is deleted: \`bot_files.ingested_at\` and \`ingest_error\` keep the outcome`,
            isQueue: {
                maxAttempts: 3,
                lockTimeout: 10 * 60 * 1000,
                backoff: 30_000,
                deleteOnComplete: true,
            },
            fields: [
                {
                    fieldName: "file_id",
                    fieldDescription: `The \`bot_files\` row to (re)ingest`,
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_file_ingest_queue_file_id",
                    indexTableFields: ["file_id"],
                },
            ],
        },
        {
            tableName: "app_settings",
            tableDescription: `Install-wide settings the app reads that aren't envs: an env's value is handed to bots and computers, which a storage quota must never be`,
            fields: [
                {
                    fieldName: "key",
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "value",
                    dataType: "TEXT",
                },
            ],
        },
    ],
};

export default schema;
