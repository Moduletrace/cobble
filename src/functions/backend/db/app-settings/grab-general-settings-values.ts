import generalSettingsHref, {
    GeneralSettingsAudiences,
    GeneralSettingsSections,
    type GeneralSettingsFieldKind,
    type GeneralSettingsSectionValues,
    type GeneralSettingsValue,
} from "@/src/dict/general-settings-dict";
import settingValueLabel from "@/src/utils/setting-value-label";
import grabChatroomRetentionOverview from "./grab-chatroom-retention";
import grabComputerWorkspaceQuotaOverview from "./grab-computer-workspace-quota-overview";
import grabHookCallRetentionOverview from "./grab-hook-events-keep-days";
import grabInstallName from "./grab-install-name";
import grabLogRetentionOverview from "./grab-logs-keep-days";
import grabMessageLengthOverview from "./grab-bot-message-max-chars";
import grabRunLimitsOverview from "./grab-run-limits";
import grabSessionLengthOverview from "./grab-bot-session-max-messages";
import grabSkillLimitsOverview from "./grab-skill-limits";
import grabStorageQuotaOverview from "./grab-storage-quota-overview";
import grabSystemPromptAppendOverview from "./grab-system-prompt-append";

export type { GeneralSettingsSectionValues };

type RawValues = Record<string, number | string | null>;

/**
 * General settings whose value a bot may need to quote, read live so a
 * pill it writes says what the page says now (a limit raised after the run
 * started shows its new number).
 */
export default async function grabGeneralSettingsValues(): Promise<GeneralSettingsSectionValues[]> {
    const [run_limits, skill_limits, hook_calls, logs, chatrooms, sessions, messages, storage, computer_workspace, appendix, install_name] =
        await Promise.all([
            grabRunLimitsOverview().catch(() => null),
            grabSkillLimitsOverview().catch(() => null),
            grabHookCallRetentionOverview().catch(() => null),
            grabLogRetentionOverview().catch(() => null),
            grabChatroomRetentionOverview().catch(() => null),
            grabSessionLengthOverview().catch(() => null),
            grabMessageLengthOverview().catch(() => null),
            grabStorageQuotaOverview().catch(() => null),
            grabComputerWorkspaceQuotaOverview().catch(() => null),
            grabSystemPromptAppendOverview().catch(() => null),
            grabInstallName().catch(() => ""),
        ]);

    const raw: Record<string, RawValues> = {
        "run-limits": {
            task_steps: run_limits?.task_steps ?? null,
            reply_steps: run_limits?.reply_steps ?? null,
            unattended_steps: run_limits?.unattended_steps ?? null,
            run_tokens: run_limits?.run_tokens ?? null,
            context_tokens: run_limits?.context_tokens ?? null,
            model_rest_seconds: run_limits?.model_rest_seconds ?? null,
        },
        sessions: { max_messages: sessions?.max_messages ?? null },
        messages: { max_chars: messages?.max_chars ?? null },
        "skill-limits": {
            body_max_chars: skill_limits?.body_max_chars ?? null,
            body_shown_chars: skill_limits?.body_shown_chars ?? null,
        },
        "hook-calls": { keep_days: hook_calls?.keep_days ?? null },
        chatrooms: {
            keep_days: chatrooms?.keep_days ?? null,
            max_per_place: chatrooms?.max_per_place ?? null,
        },
        "activity-log": { keep_days: logs?.keep_days ?? null },
        storage: { quota_mb: storage?.quota_mb ?? null },
        "computer-workspaces": { quota_mb: computer_workspace?.quota_mb ?? null },
        "prompt-appendix": { appendix: appendix ? appendix.length : null },
        "install-name": { install_name: install_name || null },
    };

    return GeneralSettingsSections.filter((section) => section.fields.length > 0).map((section) => {
        const values = raw[section.key] || {};

        return {
            key: section.key,
            title: section.title,
            href: generalSettingsHref({ section: section.key }),
            editor: GeneralSettingsAudiences[section.editable_by],
            editable_by: section.editable_by,
            values: section.fields.map((field) => ({
                key: field.key,
                title: field.title,
                label: settingValueLabel({
                    kind: field.kind as GeneralSettingsFieldKind,
                    value: values[field.key] ?? null,
                }),
            })),
        } satisfies GeneralSettingsSectionValues;
    });
}