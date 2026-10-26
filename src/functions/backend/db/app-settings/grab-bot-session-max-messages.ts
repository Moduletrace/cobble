import { AppData } from "@/src/data/app-data";
import { BotSessionMaxMessagesSettingKey } from "@/src/dict/bot-dict";
import type { SessionLengthOverview } from "@/src/types";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * How many messages a session takes before the user's next message starts
 * a new one: the install's own number (`bot_session_max_messages`,
 * Settings > General), else `AppData.BotSessionMaxMessages`.
 */
export async function grabBotSessionMaxMessages() {
    return readStepLimit({
        saved: await grabAppSetting({ key: BotSessionMaxMessagesSettingKey }),
        fallback: AppData.BotSessionMaxMessages,
        max: AppData.BotSessionMaxMessagesMax,
    });
}

/**
 * The number with its default and ceiling, for the settings page.
 */
export default async function grabSessionLengthOverview() {
    const overview: SessionLengthOverview = {
        max_messages: await grabBotSessionMaxMessages(),
        default_messages: AppData.BotSessionMaxMessages,
        max: AppData.BotSessionMaxMessagesMax,
    };

    return overview;
}
