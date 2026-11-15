import { useEffect, useState } from "react";
import type { BotSuggestionView } from "@/src/types";
import loadRefView from "../(utils)/ref-view-loader";

type Params = {
    suggestion_id: number;
};

/**
 * Next steps a bot suggested (`[suggestion:ID]`): read when their buttons
 * render. Only the user they were suggested to can read them; anyone else
 * gets null. A read that failed or hung is tried again before the buttons
 * give up on it (`loadRefView`), so a missed push or a sleeping phone no
 * longer needs the page reloaded.
 */
export default function useBotSuggestion({ suggestion_id }: Params) {
    const [view, setView] = useState<BotSuggestionView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        setLoading(true);

        loadRefView<BotSuggestionView>({
            key: `suggestion:${suggestion_id}`,
            url: `/api/admin/bot-suggestions/get-suggestion?suggestion_id=${suggestion_id}`,
        }).then((result) => {
            if (!live) return;
            setView(result);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [suggestion_id]);

    return { view, loading };
}