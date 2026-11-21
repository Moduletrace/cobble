import { useEffect, useRef } from "react";
import type { BotPlanChangedData, BotPlanView } from "@/src/types";
import useServerEvent from "@/src/hooks/use-server-event";
import { BotPlanChangedEvent } from "@/src/utils/bot-plan-changed-event";
import fetchBotPlan from "../(functions)/fetch-bot-plan";

type Params = {
    /**
     * The conversation on show: a plan only ever shows in its own.
     */
    session_id?: number | null;
    on_change: (plan: BotPlanView | null) => void;
};

/**
 * The plan open in the conversation, for the thread's plan bar: seeded by
 * the history's `plan`, then kept current from the app's pushes (written, a
 * step done, approved, paused, ended) and from the card that moved it,
 * which announces the change at once. The bar hides a plan that is no
 * longer open, so a finished one is read rather than pushed away.
 */
export default function useSessionPlan({ session_id, on_change }: Params) {
    const change = useRef(on_change);
    change.current = on_change;

    useServerEvent({
        event: "server:bot-plan",
        onData: (data: BotPlanChangedData) => {
            if (!session_id || Number(data?.session_id) != Number(session_id)) return;

            void fetchBotPlan({ plan_id: Number(data.plan_id) })
                .then((res) => {
                    if (res.success && res.singleRes) change.current(res.singleRes);
                })
                .catch(() => null);
        },
    });

    useEffect(() => {
        const listener = (event: Event) => {
            const plan = (event as CustomEvent<{ plan?: BotPlanView }>).detail?.plan;

            if (!plan || !session_id || Number(plan.session_id) != Number(session_id)) return;

            change.current(plan);
        };

        window.addEventListener(BotPlanChangedEvent, listener);

        return () => window.removeEventListener(BotPlanChangedEvent, listener);
    }, [session_id]);
}