import { AppData } from "@/src/data/app-data";
import { ChatroomKeepDaysSettingKey, ChatroomMaxPerPlaceSettingKey } from "@/src/dict/chatroom-dict";
import type { ChatroomRetentionOverview } from "@/src/types";
import readStepLimit from "@/src/utils/read-step-limit";
import grabAppSetting from "./grab-app-setting";

/**
 * How many days closed chatrooms are kept (`chatroom_keep_days`), else
 * `AppData.ChatroomKeepDays`.
 */
export async function grabChatroomKeepDays() {
    return readStepLimit({
        saved: await grabAppSetting({ key: ChatroomKeepDaysSettingKey }),
        fallback: AppData.ChatroomKeepDays,
        max: AppData.ChatroomKeepDaysMax,
    });
}

/**
 * How many rooms one place keeps (`chatroom_max_per_place`), else
 * `AppData.ChatroomMaxPerPlace`.
 */
export async function grabChatroomMaxPerPlace() {
    return readStepLimit({
        saved: await grabAppSetting({ key: ChatroomMaxPerPlaceSettingKey }),
        fallback: AppData.ChatroomMaxPerPlace,
        max: AppData.ChatroomMaxPerPlaceMax,
    });
}

/**
 * Both numbers with their defaults and ceilings, for the settings page.
 */
export default async function grabChatroomRetentionOverview() {
    const overview: ChatroomRetentionOverview = {
        keep_days: await grabChatroomKeepDays(),
        default_days: AppData.ChatroomKeepDays,
        max_days: AppData.ChatroomKeepDaysMax,
        max_per_place: await grabChatroomMaxPerPlace(),
        default_per_place: AppData.ChatroomMaxPerPlace,
        max_per_place_ceiling: AppData.ChatroomMaxPerPlaceMax,
    };

    return overview;
}
