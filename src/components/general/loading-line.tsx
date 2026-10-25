import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";

type Props = {
    label?: string;
    className?: string;
};

/**
 * A thin line sweeping across, set just under a pane header while its
 * page loads. Takes no height (it overlays the top of what follows), so
 * nothing moves when it goes. Under reduced motion it holds still.
 */
export default function LoadingLine({ label = "Loading", className }: Props) {
    return (
        <Stack
            role="progressbar"
            aria-label={label}
            className={twMerge("relative h-0 w-full shrink-0 gap-0! z-10", className)}
        >
            <Stack className="absolute inset-x-0 top-0 h-0.5 gap-0! overflow-hidden bg-ink/5">
                <Span
                    className={twMerge(
                        "block h-full w-1/3 bg-linear-to-r from-transparent via-ink to-transparent",
                        "animate-loading-line",
                        "motion-reduce:animate-none motion-reduce:w-full motion-reduce:opacity-30",
                    )}
                />
            </Stack>
        </Stack>
    );
}
