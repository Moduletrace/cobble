import type { TWUIButtonColorType } from "@moduletrace/twui/layout/Button";
import { LogCategories } from "@/src/dict/log-categories";

export type LogCategoryValue = (typeof LogCategories)[number]["value"];

export const LogCategoryStyles: Record<
    LogCategoryValue,
    { title: string; color: TWUIButtonColorType }
> = {
    auth: { title: "Auth", color: "primary" },
    websocket: { title: "WebSocket", color: "accent" },
    cron: { title: "Cron", color: "success" },
    system: { title: "System", color: "gray" },
    error: { title: "Error", color: "error" },
};
