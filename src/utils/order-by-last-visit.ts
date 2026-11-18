type Item = {
    id?: number | string;
    last_visited_at?: number | null;
    created_at?: number | string | null;
};

type Params<T> = {
    items: T[];
    /**
     * Rank an item nobody visited yet by when it was made, so a new one
     * (a workspace just created) leads instead of falling below every
     * visited one, out of the rail's shown slice.
     */
    unvisited_by_created?: boolean;
    /**
     * The conversation open now: it leads whatever the visits say, so it
     * is already on top as the page arrives and a refresh from another
     * device can't push it down.
     */
    pinned_id?: number | string | null;
};

/**
 * A rail list (workspaces, bots): what the user has visited first, latest
 * first, then the rest in their order. With `unvisited_by_created`, an
 * unvisited item ranks by its `created_at` among the visited ones; with
 * `pinned_id`, that item leads them all.
 */
export default function orderByLastVisit<T extends Item>({ items, unvisited_by_created, pinned_id }: Params<T>): T[] {
    const rank = (item: T) =>
        Number(item.last_visited_at || (unvisited_by_created ? item.created_at : 0) || 0);

    const pinned =
        pinned_id == null ? undefined : items.find((item) => item.id == pinned_id);
    const rest = pinned ? items.filter((item) => item !== pinned) : items;
    const ranked = rest.filter((item) => rank(item)).sort((a, b) => rank(b) - rank(a));
    const ordered = [...ranked, ...rest.filter((item) => !rank(item))];

    return pinned ? [pinned, ...ordered] : ordered;
}
