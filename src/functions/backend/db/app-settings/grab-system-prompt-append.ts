import { BotSystemPromptAppendSettingKey } from "@/src/dict/bot-dict";
import grabAppSetting from "./grab-app-setting";

/**
 * The install-wide text appended to every bot's prompt, right after its own
 * core instructions (`bot_system_prompt_append`, from Settings > General).
 * Empty when the install never set one.
 */
export default async function grabSystemPromptAppend() {
    const saved = await grabAppSetting({ key: BotSystemPromptAppendSettingKey });

    return saved?.trim() || "";
}

/**
 * The same text with its setting key, for the settings page.
 */
export async function grabSystemPromptAppendOverview() {
    return {
        setting_key: BotSystemPromptAppendSettingKey,
        text: await grabSystemPromptAppend(),
    };
}

export type SystemPromptAppendOverview = Awaited<
    ReturnType<typeof grabSystemPromptAppendOverview>
>;
