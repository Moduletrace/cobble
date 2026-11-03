type Item = { last_visited_at?: number | null; created_at?: number | string | null };

type Params<T> = {
    items: T[];
    /**
     * Rank an item nobody visited yet by when it was made, so a new one
     * (a workspace just created) leads instead of falling below every
     * visited one, out of the rail's shown slice.
     */
    unvisited_by_created?: boolean;
};

/**
 * A rail list (workspaces, bots): what the user has visited first, latest
 * first, then the rest in their order. With `unvisited_by_created`, an
 * unvisited item ranks by its `created_at` among the visited ones.
 */
export default function orderByLastVisit<T extends Item>({ items, unvisited_by_created }: Params<T>): T[] {
    const rank = (item: T) =>
        Number(item.last_visited_at || (unvisited_by_created ? item.created_at : 0) || 0);

    const ranked = items.filter((item) => rank(item)).sort((a, b) => rank(b) - rank(a));

    return [...ranked, ...items.filter((item) => !rank(item))];
}
