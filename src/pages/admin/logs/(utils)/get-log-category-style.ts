import type { BUN_SQLITE_COBBLE_LOGS } from "@/db/types/db";
import type { TWUIButtonColorType } from "@moduletrace/twui/layout/Button";
import {
    LogCategoryStyles,
    type LogCategoryValue,
} from "../(data)/log-category-styles";

type Params = {
    log: BUN_SQLITE_COBBLE_LOGS;
};

export default function getLogCategoryStyle({ log }: Params): {
    title: string;
    color: TWUIButtonColorType;
} {
    const category_value = (log.category || "system") as LogCategoryValue;

    return (
        LogCategoryStyles[category_value] || {
            title: log.category || "Unknown",
            color: "gray",
        }
    );
}
