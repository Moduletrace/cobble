import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { RotateCcw } from "lucide-react";
import useServerEvent from "@/src/hooks/use-server-event";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import { AppContext } from "@/src/pages/__root";
import type { ComputerWithStatus } from "@/src/types";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";

type Props = {
    computer_id: number;
    /**
     * The computer's name, for the button's title and the confirm dialog.
     */
    name: string;
    /**
     * It's back up: whatever shows it has to connect again.
     */
    onRestarted: () => void;
};

/**
 * Restarts a computer's container after a confirm, for super admins (only
 * they run computers). Stays loading until the computer's push says how it
 * went.
 */
export default function ComputerRestartButton({ computer_id, name, onRestarted }: Props) {
    const { user_types } = useContext(AppContext);
    const [state, setState] = useState<"asking" | "waiting">();
    const [error, setError] = useState<string>();

    useServerEvent({
        event: "server:computer-updated",
        onData: (computer: ComputerWithStatus) => {
            if (state != "waiting" || computer.id != computer_id) return;
            if (computer.status == "creating") return;

            setState(undefined);

            if (computer.status == "failed") {
                setError(computer.error || "It didn't come back up.");
                return;
            }

            onRestarted();
        },
    });

    if (!isPassThroughUser({ user_types })) return null;

    const restart = async () => {
        if (
            !window.confirm(
                `Restart ${name}? Anything running on it stops, bots' work included. Its files and browser logins stay.`,
            )
        )
            return;

        setState("asking");
        setError(undefined);

        const res = await postAdminApi<ComputerWithStatus>({
            path: "computers/restart-computer",
            body: { computer_id },
        }).catch(() => null);

        if (res?.success) {
            setState("waiting");
            return;
        }

        setState(undefined);
        setError(res?.msg || "Couldn't restart it.");
    };

    return (
        <Stack className="shrink-0 gap-1! items-end">
            <Button
                title={`Restart ${name}`}
                type="button"
                variant="outlined"
                color="gray"
                size="small"
                loading={Boolean(state)}
                onClick={restart}
                className="gap-1!"
            >
                <RotateCcw size={14} aria-hidden />
                Restart
            </Button>
            {error ? (
                <Span role="alert" className="text-[13px] leading-[18px] text-ink-secondary">
                    {error}
                </Span>
            ) : null}
        </Stack>
    );
}
