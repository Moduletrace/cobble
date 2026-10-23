export type UsageRange = {
    /**
     * The days back the range totals, today included.
     */
    days: number;
    title: string;
};

/**
 * The periods the usage page offers, shortest first. A week and a month
 * are what most questions need; a quarter is for spotting a trend.
 */
export const UsageRanges: UsageRange[] = [
    { days: 7, title: "7 days" },
    { days: 30, title: "30 days" },
    { days: 90, title: "90 days" },
];

/**
 * The range asked for in the address, or the page's default when it isn't
 * one of the offered ones.
 */
export function parseUsageRange({ value }: { value?: string | null }): UsageRange | null {
    const days = Number(value);

    return UsageRanges.find((range) => range.days == days) || null;
}
