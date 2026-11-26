import { useEffect, useRef } from "react";
import { ComposerCommandEvent } from "@/src/utils/composer-command-event";

/**
 * Answers a composer command by name: while `command` is set, `on_fire` runs
 * when the composer dispatches that command. Components mounted behind a
 * closed dropdown still hear it (twui keeps the content mounted), so the
 * composer can open any of them. Pass `command` only to the instance the
 * commands should drive.
 */
export default function useOpenOnCommand({
    command,
    on_fire,
}: {
    command?: string;
    on_fire: () => void;
}) {
    const fire = useRef(on_fire);

    fire.current = on_fire;

    useEffect(() => {
        if (!command) return;

        function listen(event: Event) {
            if ((event as CustomEvent).detail != command) return;

            fire.current();
        }

        window.addEventListener(ComposerCommandEvent, listen);

        return () => window.removeEventListener(ComposerCommandEvent, listen);
    }, [command]);
}
