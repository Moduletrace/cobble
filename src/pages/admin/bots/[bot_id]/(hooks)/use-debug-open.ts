import { useCallback, useEffect, useState } from "react";
import readDebugOpen from "@/src/functions/frontend/read-debug-open";
import rememberDebugOpen from "@/src/functions/frontend/remember-debug-open";

type Params = {
    /**
     * Whose answer it is: the view belongs to the user, not to a bot, so
     * it stays as they left it in every conversation on this device.
     */
    user_id?: number | string | null;
};

/**
 * Whether the conversation's debug view is open, remembered per user on
 * this device (`readDebugOpen`). Read after the first render: the server
 * has no `localStorage`.
 */
export default function useDebugOpen({ user_id }: Params) {
    const [open, setOpenState] = useState(false);

    useEffect(() => {
        setOpenState(readDebugOpen({ user_id }));
    }, [user_id]);

    const setOpen = useCallback(
        (next: boolean) => {
            setOpenState(next);
            rememberDebugOpen({ user_id, open: next });
        },
        [user_id],
    );

    return { open, setOpen };
}