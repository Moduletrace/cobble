import type { DatabaseSearchMode } from "@/src/types";
import { SettingsDatabasePath } from "@/src/dict/settings-pages-dict";

type Params = {
    table?: string;
    search?: string;
    mode?: DatabaseSearchMode;
    page?: number;
};

/**
 * The database browser's address for what it is showing, so a table, a
 * search and a page can be linked to and the browser's own back button
 * walks back through them. What is at its default is left out.
 */
export default function databaseHref({ table, search, mode, page }: Params): string {
    const params = new URLSearchParams();

    if (table) params.set("table", table);
    if (search) params.set("search", search);
    if (mode && mode != "every_word") params.set("mode", mode);
    if (page && page > 1) params.set("page", String(page));

    const query = params.toString();

    return query ? `${SettingsDatabasePath}?${query}` : SettingsDatabasePath;
}
