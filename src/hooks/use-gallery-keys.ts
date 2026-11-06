import { useEffect, useRef } from "react";

function typingInField({ target }: { target: EventTarget | null }) {
    if (!(target instanceof HTMLElement)) return false;

    if (target.isContentEditable) return true;

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The left and right arrow keys step a preview's gallery back and forth,
 * except while typing in a field or with a modifier held.
 */
export default function useGalleryKeys({
    enabled,
    onPrevious,
    onNext,
}: {
    enabled: boolean;
    onPrevious: () => void;
    onNext: () => void;
}) {
    const handlers_ref = useRef({ onPrevious, onNext });

    handlers_ref.current = { onPrevious, onNext };

    useEffect(() => {
        if (!enabled) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

            if (typingInField({ target: event.target })) return;

            if (event.key == "ArrowLeft") handlers_ref.current.onPrevious();
            else if (event.key == "ArrowRight") handlers_ref.current.onNext();
            else return;

            event.preventDefault();
        };

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [enabled]);
}
