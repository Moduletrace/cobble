import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";

/**
 * 28px add-bot control. The 1px strong border is required for WCAG 1.4.11.
 * Add-bot flow is not designed yet, so this has no action.
 */
export default function NewBotButton() {
    return (
        <Button
            title="Add a bot"
            color="gray"
            className="hidden lg:flex size-7 p-0! rounded-default-sm bg-surface dark:bg-surface hover:bg-sunken hover:dark:bg-sunken text-ink dark:text-ink border border-solid border-hairline-strong transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
            <Span className="relative size-3" aria-hidden>
                <Span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-ink" />
                <Span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-ink" />
            </Span>
        </Button>
    );
}
