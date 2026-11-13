/**
 * The groups of Settings > General, one source for the page, the pages
 * each group has on its own and what a bot may point a user at
 * (`[setting:<section>:<field>]`).
 *
 * A field is a setting a bot can name: its `title` is the label the form
 * shows, so a pill the user reads matches the input they have to change.
 * A section is citable when a limit in it stops work, which is what makes
 * it worth sending someone to.
 */

export type GeneralSettingsFieldKind =
    | "steps"
    | "tokens"
    | "characters"
    | "mb"
    | "days"
    | "seconds"
    | "text";

/**
 * Who may read a section, and who may change it. Reading is the wider
 * right: a member can be sent to a limit they hit and see its value,
 * while only the role that owns it gets the form.
 */
export type GeneralSettingsAudience = "everyone" | "crew_manager" | "super_admin";

export type GeneralSettingsField = {
    key: string;
    title: string;
    kind: GeneralSettingsFieldKind;
};

/**
 * A setting's live value, as the form shows it.
 */
export type GeneralSettingsValue = {
    key: string;
    title: string;
    /**
     * The value as the form shows it ("20 steps"), or "not set yet".
     */
    label: string;
};

/**
 * One group of General settings with its live values, ready to describe to
 * a bot or read back to a person.
 */
export type GeneralSettingsSectionValues = {
    key: string;
    title: string;
    href: string;
    /**
     * Who may change it, in words ("the super admin", "an admin", "anyone").
     */
    editor: string;
    editable_by: GeneralSettingsAudience;
    values: GeneralSettingsValue[];
};

export type GeneralSettingsSection = {
    key: string;
    title: string;
    description: string;
    readable_by: GeneralSettingsAudience;
    editable_by: GeneralSettingsAudience;
    /**
     * A bot may name a field of this section in a ref (`read_settings`).
     */
    citable: boolean;
    fields: GeneralSettingsField[];
};

export const GeneralSettingsRoot = "/admin/settings/general";

export const GeneralSettingsAudiences: Record<GeneralSettingsAudience, string> = {
    everyone: "anyone",
    crew_manager: "an admin",
    super_admin: "the super admin",
};

export const GeneralSettingsSections: GeneralSettingsSection[] = [
    {
        key: "theme",
        title: "Theme",
        description: "Saved on this device only, so each computer can have its own.",
        readable_by: "everyone",
        editable_by: "everyone",
        citable: false,
        fields: [],
    },
    {
        key: "notifications",
        title: "Notifications",
        description: "A notification arrives when a bot replies or needs you and the app is closed.",
        readable_by: "everyone",
        editable_by: "everyone",
        citable: false,
        fields: [],
    },
    {
        key: "install-name",
        title: "App name",
        description: "The name this install goes by when it's added to a home screen or app list.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: false,
        fields: [{ key: "install_name", title: "Install name", kind: "text" }],
    },
    {
        key: "install-icon",
        title: "App icon",
        description: "The icon this install shows on home screens, app lists and notifications.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: false,
        fields: [],
    },
    {
        key: "prompt-appendix",
        title: "Prompt appendix",
        description: "Text added to every bot's instructions, right after its own.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [{ key: "appendix", title: "Appendix", kind: "characters" }],
    },
    {
        key: "run-limits",
        title: "Run limits",
        description: "How long a bot may work on one run, how much of its work it sends the model each turn, and how long a failed model rests. Each limit can be unlimited.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [
            { key: "task_steps", title: "Tool steps per task", kind: "steps" },
            { key: "reply_steps", title: "Tool steps per chat reply", kind: "steps" },
            { key: "unattended_steps", title: "Tool steps per routine or hook call", kind: "steps" },
            { key: "run_tokens", title: "Tokens per run", kind: "tokens" },
            { key: "context_tokens", title: "Working context", kind: "tokens" },
            { key: "model_rest_seconds", title: "Model rest after a failure", kind: "seconds" },
        ],
    },
    {
        key: "sessions",
        title: "Sessions",
        description: "Every reply re-reads the session's recent messages, so a long session costs more tokens each time.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [{ key: "max_messages", title: "Start a new session after", kind: "steps" }],
    },
    {
        key: "messages",
        title: "Messages",
        description: "How long a message users may send to a bot, and the longest one the bot may answer.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [{ key: "max_chars", title: "Longest message", kind: "characters" }],
    },
    {
        key: "skill-limits",
        title: "Skill limits",
        description: "How much of a skill's runbook a bot may store, and how much of it it reads at once.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [
            { key: "body_max_chars", title: "Longest runbook", kind: "characters" },
            { key: "body_shown_chars", title: "Runbook a bot reads at once", kind: "characters" },
        ],
    },
    {
        key: "hook-calls",
        title: "Hook calls",
        description: "How long a hook's calls are kept, so they can still be searched.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [{ key: "keep_days", title: "Keep hook calls for", kind: "days" }],
    },
    {
        key: "run-traces",
        title: "Run traces",
        description: "How long the debug view keeps what a run did in detail: its turns, reasoning, tool calls and results.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [{ key: "keep_days", title: "Keep run traces for", kind: "days" }],
    },
    {
        key: "chatrooms",
        title: "Chatrooms",
        description: "How many chatrooms are kept per place, and for how long once they close.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: true,
        fields: [
            { key: "keep_days", title: "Keep closed chatrooms for", kind: "days" },
            { key: "max_per_place", title: "Most chatrooms per place", kind: "steps" },
        ],
    },
    {
        key: "activity-log",
        title: "Activity log",
        description: "How long the app keeps its own log of what happened.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: false,
        fields: [{ key: "keep_days", title: "Keep activity for", kind: "days" }],
    },
    {
        key: "storage",
        title: "Storage",
        description: "How much each folder may hold: a bot's own, and each workspace's.",
        readable_by: "everyone",
        editable_by: "crew_manager",
        citable: true,
        fields: [{ key: "quota_mb", title: "Megabytes per folder", kind: "mb" }],
    },
    {
        key: "computer-workspaces",
        title: "Computer workspace limit",
        description: "How much a computer's workspace may hold, so one can't fill the host it runs on.",
        readable_by: "everyone",
        editable_by: "crew_manager",
        citable: true,
        fields: [{ key: "quota_mb", title: "Megabytes per computer", kind: "mb" }],
    },
    {
        key: "docker-networks",
        title: "Docker networks",
        description: "Extra docker networks the app joins, so it can reach containers or services of yours.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: false,
        fields: [],
    },
    {
        key: "version",
        title: "Version",
        description: "The release this server runs, so an update can be confirmed from the app.",
        readable_by: "everyone",
        editable_by: "super_admin",
        citable: false,
        fields: [],
    },
];

const withFields = GeneralSettingsSections.filter((section) => section.fields.length > 0);

export const CitableGeneralSettingsSections = withFields.filter((section) => section.citable);

export function findGeneralSettingsSection({ key }: { key?: string | null }) {
    return GeneralSettingsSections.find((section) => section.key == key) || null;
}

export function findCitableGeneralSettingsSection({ key }: { key?: string | null }) {
    return CitableGeneralSettingsSections.find((section) => section.key == key) || null;
}

export function findGeneralSettingsField({
    section,
    field,
}: {
    section?: string | null;
    field?: string | null;
}) {
    const found = findGeneralSettingsSection({ key: section });

    if (!found || !field) return null;

    return found.fields.find((item) => item.key == field) || null;
}

/**
 * Where a section (and optionally one field of it) lives, for a link or a
 * ref: the section has its own page under General, the field is its
 * anchor on that page.
 */
export default function generalSettingsHref({
    section,
    field,
}: {
    section?: string | null;
    field?: string | null;
}) {
    if (!section) return GeneralSettingsRoot;

    return `${GeneralSettingsRoot}/${section}${field ? `#${field}` : ""}`;
}