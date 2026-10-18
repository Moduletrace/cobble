import Button from "@moduletrace/twui/layout/Button";

/**
 * Opens the machine the bot is working on. Disabled until the task has one.
 */
export default function OpenComputerButton({ url }: { url?: string | null }) {
    return (
        <Button
            title="Open computer"
            color="gray"
            href={url || undefined}
            target="_blank"
            disabled={!url}
            className="w-full h-9 rounded-default text-[13px] font-bold bg-surface dark:bg-surface hover:bg-sunken hover:dark:bg-sunken text-ink dark:text-ink border border-solid border-hairline-strong transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
            Open computer
        </Button>
    );
}
