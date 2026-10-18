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
import type { BUN_SQLITE_DatabaseSchemaType } from "@moduletrace/bun-sqlite/types";

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
                    fieldDescription: `Workspace owner`,
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
                    fieldDescription: `One coordinator per workspace; everything else is a worker`,
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
    ],
};

export default schema;
