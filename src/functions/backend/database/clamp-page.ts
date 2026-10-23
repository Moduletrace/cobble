type Params = {
    /**
     * The page asked for, from 1.
     */
    page: number;
    /**
     * How many records the table holds (or how many matched a search).
     */
    total: number;
    page_size: number;
};

/**
 * The page that actually gets read: a page past the end of the table lands
 * on its last one (so a stale link or a deleted record never shows an empty
 * page), and a table with nothing in it still has a first page.
 */
export default function clampPage({ page, total, page_size }: Params): number {
    const size = Math.max(1, Math.trunc(page_size) || 1);
    const last = Math.max(1, Math.ceil(total / size));

    return Math.min(Math.max(1, Math.trunc(page) || 1), last);
}
