import { useEffect, useId, useRef } from "react";

/**
 * The open modals that close on Escape one at a time, oldest first.
 */
const OpenModals: string[] = [];

/**
 * Escape closes only the modal on top. twui's modal closes every open one
 * on the same key press, so a file opened from a folder (or a folder from
 * a file) would take both away. Listening first, on the window's capture
 * phase, the modal on top closes itself and the press goes no further.
 */
export default function useTopModalEscape({ onClose }: { onClose: () => void }) {
    const id = useId();
    const close_ref = useRef(onClose);

    close_ref.current = onClose;

    useEffect(() => {
        OpenModals.push(id);

        const onKey = (event: KeyboardEvent) => {
            if (event.key != "Escape" || OpenModals.at(-1) != id) return;

            event.stopPropagation();
            close_ref.current();
        };

        window.addEventListener("keydown", onKey, true);

        return () => {
            window.removeEventListener("keydown", onKey, true);

            const index = OpenModals.lastIndexOf(id);

            if (index >= 0) OpenModals.splice(index, 1);
        };
    }, [id]);
}
