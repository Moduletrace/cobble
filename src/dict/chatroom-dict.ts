/**
 * Where a chatroom stands. A room is open while the coordinator works the
 * request; every other status is final and the asking bot has been told.
 */
export const ChatroomStatuses = [
    {
        title: "Open",
        value: "open",
    },
    {
        title: "Answered",
        value: "answered",
    },
    {
        title: "Refused",
        value: "refused",
    },
    {
        title: "Failed",
        value: "failed",
    },
    {
        title: "Stopped",
        value: "stopped",
    },
] as const;

export type ChatroomStatus = (typeof ChatroomStatuses)[number]["value"];

/**
 * The title of the coordinator's turns in a room, on its jobs.
 */
export const ChatroomTurnJobTitle = "Chatroom request";

/**
 * App settings: how many days closed chatrooms are kept, and how many rooms
 * one place keeps (`AppData.ChatroomKeepDays`, `ChatroomMaxPerPlace`).
 */
export const ChatroomKeepDaysSettingKey = "chatroom_keep_days";
export const ChatroomMaxPerPlaceSettingKey = "chatroom_max_per_place";
