import { useEffect, useRef, type RefObject } from "react";
import Loading from "@moduletrace/twui/elements/Loading";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    loading?: boolean;
    error?: string;
    onLoad?: () => void;
    /**
     * Opens a page instead of loading more here (the session before this
     * one, read as it was).
     */
    href?: string;
    /**
     * Defaults to "Show earlier messages".
     */
    label?: string;
};

/**
 * The top of a thread with older messages: loads them as it scrolls into
 * view, with a button for when it can't (or a load failed). With `href` it
 * is only ever a link.
 */
export default function OlderMessagesLoader({
    loading = false,
    error,
    onLoad,
    href,
    label = "Show earlier messages",
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const load = useRef(onLoad);

    load.current = onLoad;

    useEffect(() => {
        const el = ref.current;

        if (!el || href || error || typeof IntersectionObserver == "undefined") return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) load.current?.();
            },
            { rootMargin: "400px 0px 0px 0px" },
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, [error, loading, href]);

    return (
        <Stack
            componentRef={ref as RefObject<HTMLDivElement>}
            className="w-full items-center justify-center min-h-8"
        >
            {loading ? (
                <Loading size="smaller" />
            ) : (
                <Button
                    title={label}
                    type="button"
                    variant="ghost"
                    color="text"
                    href={href}
                    onClick={onLoad}
                    className="text-[13px]! leading-[18px]! text-ink-secondary"
                >
                    {error ? `${error} Try again` : label}
                </Button>
            )}
        </Stack>
    );
}
