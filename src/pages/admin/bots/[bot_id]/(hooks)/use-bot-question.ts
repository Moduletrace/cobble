import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useEffect, useState } from "react";
import type { BotQuestionView } from "@/src/types";

type Params = {
    question_id: number;
};

/**
 * Questions already read, by id, so a thread naming them twice asks once.
 * An answer replaces their entry.
 */
const loaded = new Map<number, Promise<BotQuestionView | null>>();

function loadQuestion({ question_id }: Params) {
    const cached = loaded.get(question_id);

    if (cached) return cached;

    const pending = fetchApi<{}, APIResponseObject<BotQuestionView>>(
        `/api/admin/bot-questions/get-question?question_id=${question_id}`,
        { method: "GET" },
    )
        .then((res) => (res?.success && res.singleRes ? res.singleRes : null))
        .catch(() => null);

    loaded.set(question_id, pending);

    return pending;
}

/**
 * Questions a bot asked (`[question:ID]`), for their chip and card: read
 * when the chip renders, so it shows whether they're still waiting. Only
 * the user they were asked of can read them; anyone else gets null.
 */
export default function useBotQuestion({ question_id }: Params) {
    const [view, setViewState] = useState<BotQuestionView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        loadQuestion({ question_id }).then((result) => {
            if (!live) return;
            setViewState(result);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [question_id]);

    const setView = useCallback(
        (next: BotQuestionView) => {
            loaded.set(question_id, Promise.resolve(next));
            setViewState(next);
        },
        [question_id],
    );

    return { view, loading, setView };
}
