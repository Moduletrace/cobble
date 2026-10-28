export const LogCategories = [
    {
        title: "Auth",
        value: "auth",
    },
    {
        title: "WebSocket",
        value: "websocket",
    },
    {
        title: "Cron",
        value: "cron",
    },
    {
        title: "Hook",
        value: "hook",
    },
    {
        title: "System",
        value: "system",
    },
    {
        title: "Error",
        value: "error",
    },
] as const;

/**
 * The app setting (Settings > General) for how many days logs are kept,
 * else `AppData.LogsKeepDays`.
 */
export const LogsKeepDaysSettingKey = "logs_keep_days";
