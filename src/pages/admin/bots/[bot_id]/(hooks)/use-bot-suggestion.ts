import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { BotSuggestionView } from "@/src/types";

type Params = {
    suggestion_id: number;
};

/**
 * Next steps already read, by id, so a thread naming them twice asks once.
 */
const loaded = new Map<number, Promise<BotSuggestionView | null>>();

function loadSuggestion({ suggestion_id }: Params) {
    const cached = loaded.get(suggestion_id);

    if (cached) return cached;

    const pending = fetchApi<{}, APIResponseObject<BotSuggestionView>>(
        `/api/admin/bot-suggestions/get-suggestion?suggestion_id=${suggestion_id}`,
        { method: "GET" },
    )
        .then((res) => (res?.success && res.singleRes ? res.singleRes : null))
        .catch(() => null);

    loaded.set(suggestion_id, pending);

    return pending;
}

/**
 * Next steps a bot suggested (`[suggestion:ID]`): read when their buttons
 * render. Only the user they were suggested to can read them; anyone else
 * gets null.
 */
export default function useBotSuggestion({ suggestion_id }: Params) {
    const [view, setView] = useState<BotSuggestionView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        loadSuggestion({ suggestion_id }).then((result) => {
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