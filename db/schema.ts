import { LogCategories } from "@/src/dict/log-categories";
import { MediaParadigms, MediaTypes } from "@/src/dict/media-dict";
import {
    BotFaces,
    BotHues,
    BotKinds,
    BotMessageAuthors,
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
import { BotJobKinds } from "@/src/dict/bot-queue-dict";
import { AppData } from "@/src/data/app-data";
import type { BUN_SQLITE_DatabaseSchemaType } from "@moduletrace/bun-sqlite/types";
import { EnvParadigms } from "@/src/dict/env-dict";

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
                    fieldName: "is_private",
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
                    fieldDescription: `Bot owner`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "bot_user_fk",
                    },
                },
                {
                    fieldName: "name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "kind",
                    fieldDescription: `One coordinator per owner; everything else is a worker`,
                    dataType: "TEXT",
                    options: BotKinds.map((bk) => bk.value),
                    defaultValue: "worker",
                },
                {
                    fieldName: "hue",
                    fieldDescription: `Permanent identity hue. Null for the coordinator`,
                    dataType: "TEXT",
                    options: BotHues.map((bh) => bh.value),
                },
                {
                    fieldName: "role",
                    fieldDescription: `The bot's job in one line. Null for the coordinator`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "face",
                    fieldDescription: `The bot's status, shown as its face`,
                    dataType: "TEXT",
                    options: BotFaces.map((bf) => bf.value),
                    defaultValue: "idle",
                },
                {
                    fieldName: "status_line",
                    fieldDescription: `Short status sentence, e.g. "Waiting on you"`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "system_prompt",
                    fieldDescription: `The bot's core instructions, in markdown. The bot can rewrite it`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "memory",
                    fieldDescription: `What the bot must always remember, in markdown. The bot keeps it up to date`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "unread",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
                {
                    fieldName: "last_activity_at",
                    fieldDescription: `Unix timestamp of the latest message, for rail ordering`,
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
            ],
            indexes: [
                {
                    indexName: "idx_bot_messages_bot_id_created_at",
                    indexTableFields: ["bot_id", "created_at"],
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
            tableName: "workspaces",
            fields: [
                {
                    fieldName: "user_id",
                    fieldDescription: `Workspace owner`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "workspace_user_fk",
                    },
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
                    fieldDescription: `Shared context in markdown, appended to the prompt of every bot in the workspace`,
                    dataType: "TEXT",
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
                    fieldDescription: `Computer owner`,
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "users",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "computer_user_fk",
                    },
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
                    fieldDescription: `Where it applies: general, a workspace, or a computer. Computer beats workspace beats general`,
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
    ],
};

export default schema;
