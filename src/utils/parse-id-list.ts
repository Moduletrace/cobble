type Params = {
    /**
     * Ids, comma separated (a `GROUP_CONCAT`).
     */
    ids?: string | null;
};

/**
 * Comma separated ids as numbers, leaving out anything that isn't one.
 */
export default function parseIdList({ ids }: Params): number[] {
    return (ids || "")
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id) && id > 0);
}
