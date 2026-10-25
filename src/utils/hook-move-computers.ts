import AppError from "./app-error";

type Params = {
    /**
     * The hook's title, for the refusal.
     */
    title: string;
    watching: boolean;
    computer_id?: number | string | null;
    watch_computer_id?: number | string | null;
    /**
     * The ids of the computers its bot reaches where the hook goes.
     */
    reachable_ids: (number | string)[];
};

/**
 * The computer a moved hook's runs use: kept only when its bot reaches it
 * in the new place, else null (the bot's current one). A
 * browser-notification hook can't move where its bot doesn't reach the
 * computer it watches, since that computer's watcher is what calls it.
 */
export default function hookMoveComputers({ title, watching, computer_id, watch_computer_id, reachable_ids }: Params) {
    const reaches = (id?: number | string | null) => Boolean(id) && reachable_ids.some((it) => String(it) == String(id));

    if (watching && !reaches(watch_computer_id)) {
        throw new AppError(
            `"${title}" takes the browser notifications of computer #${watch_computer_id}, which the bot doesn't reach there.`,
        );
    }

    const kept = reaches(computer_id) ? Number(computer_id) : null;

    return { computer_id: kept, computer_dropped: Boolean(computer_id && !kept) };
}
