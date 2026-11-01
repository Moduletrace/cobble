type Params<T> = {
    items: T[];
};

/**
 * A rail list (workspaces, bots): what the user has visited first, latest
 * first, then the rest in their order.
 */
export default function orderByLastVisit<T extends { last_visited_at?: number | null }>({ items }: Params<T>): T[] {
    const visited = items
        .filter((item) => item.last_visited_at)
        .sort((a, b) => Number(b.last_visited_at) - Number(a.last_visited_at));

    return [...visited, ...items.filter((item) => !item.last_visited_at)];
}
