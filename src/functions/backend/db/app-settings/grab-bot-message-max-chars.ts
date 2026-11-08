import { AppData } from "@/src/data/app-data";
import { BotMessageMaxCharsSettingKey } from "@/src/dict/bot-dict";
import type { MessageLengthOverview } from "@/src/types";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * The longest chat message a user may send, in characters: the install's
 * own number (`bot_message_max_chars`, Settings > General), else
 * `AppData.BotMessageMaxChars`.
 */
export async function grabBotMessageMaxChars() {
    return readStepLimit({
        saved: await grabAppSetting({ key: BotMessageMaxCharsSettingKey }),
        fallback: AppData.BotMessageMaxChars,
        max: AppData.BotMessageMaxCharsMax,
    });
}

/**
 * The number with its default and ceiling, for the settings page.
 */
export default async function grabMessageLengthOverview() {
    const overview: MessageLengthOverview = {
        max_chars: await grabBotMessageMaxChars(),
        default_chars: AppData.BotMessageMaxChars,
        max: AppData.BotMessageMaxCharsMax,
    };

    return overview;
}
