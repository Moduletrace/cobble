import { LogCategories } from "@/src/dict/log-categories";
import type { LogCategoryValue } from "./log-category-styles";

export type LogCategoryFilter = {
    title: string;
    value?: LogCategoryValue;
};

export const LogCategoryFilters: LogCategoryFilter[] = [
    { title: "All" },
    ...LogCategories.map((lc) => ({ title: lc.title, value: lc.value })),
];
