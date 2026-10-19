import Button from "@moduletrace/twui/layout/Button";

type Props = {
    title: string;
    active: boolean;
    onPick: () => void;
};

/**
 * One mode in a computer view's toolbar (Browser, Terminal, Code).
 */
export default function ComputerViewModeButton({ title, active, onPick }: Props) {
    return (
        <Button
            type="button"
            title={title}
            role="tab"
            aria-selected={active}
            variant="ghost"
            color="text"
            onClick={onPick}
            className={`px-3! py-1.5! text-[13px] leading-[18px] rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink ${
                active
                    ? "bg-sunken dark:bg-sunken text-ink dark:text-ink font-bold"
                    : "text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken"
            }`}
        >
            {title}
        </Button>
    );
}
