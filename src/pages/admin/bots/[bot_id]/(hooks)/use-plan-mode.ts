import { useCallback, useEffect, useState } from "react";
import readPlanMode from "@/src/functions/frontend/read-plan-mode";
import rememberPlanMode from "@/src/functions/frontend/remember-plan-mode";

type Params = {
    bot_id?: number | string | null;
    /**
     * The conversation's workspace: Plan mode belongs to one conversation,
     * so the bot's own chat and its chat in a workspace keep their own.
     */
    workspace_id?: number | string | null;
};

/**
 * Whether the conversation's next message goes in Plan mode: the bot plans
 * and reads, and changes nothing. It is remembered per conversation on this
 * device (`readPlanMode`), and read after the first render since the server
 * has no `localStorage`.
 */
export default function usePlanMode({ bot_id, workspace_id }: Params) {
    const [plan_mode, setPlanModeState] = useState(false);

    useEffect(() => {
        setPlanModeState(readPlanMode({ bot_id, workspace_id }));
    }, [bot_id, workspace_id]);

    const setPlanMode = useCallback(
        (next: boolean) => {
            setPlanModeState(next);
            rememberPlanMode({ bot_id, workspace_id, on: next });
        },
        [bot_id, workspace_id],
    );

    const togglePlanMode = useCallback(() => {
        setPlanMode(!plan_mode);
    }, [plan_mode, setPlanMode]);

    return { plan_mode, set_plan_mode: setPlanMode, toggle_plan_mode: togglePlanMode };
}