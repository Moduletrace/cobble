import { useCallback, useEffect, useState } from "react";
import type { BotQuestionView } from "@/src/types";
import loadRefView, { primeRefView, subscribeRefView } from "../(utils)/ref-view-loader";

type Params = {
    question_id: number;
};

/**
 * Questions a bot asked (`[question:ID]`), for their chip and card: read
 * when the chip renders, so it shows whether they're still waiting. Only
 * the user they were asked of can read them; anyone else gets null. A
 * read that failed or hung is tried again (`loadRefView`) instead of
 * leaving the card unopenable until the page is reloaded, and answering
 * one card tells the thread's other cards of the same question.
 */
export default function useBotQuestion({ question_id }: Params) {
    const [view, setViewState] = useState<BotQuestionView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;
        const key = `question:${question_id}`;

        setLoading(true);

        const unsubscribe = subscribeRefView({
            key,
            listener: (next) => {
                if (!live) return;
                setViewState(next as BotQuestionView);
                setLoading(false);
            },
        });

        loadRefView<BotQuestionView>({
            key,
            url: `/api/admin/bot-questions/get-question?question_id=${question_id}`,
        }).then((result) => {
            if (!live) return;
            setViewState(result);
            setLoading(false);
        });

        return () => {
            live = false;
            unsubscribe();
        };
    }, [question_id]);

    /**
     * The card's own answers replace what was read, so its chip says they
     * were answered without asking the app again.
     */
    const setView = useCallback(
        (next: BotQuestionView) => {
            primeRefView({ key: `question:${question_id}`, view: next });
            setViewState(next);
        },
        [question_id],
    );

    return { view, loading, setView };
}