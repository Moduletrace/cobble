import Button from "@moduletrace/twui/layout/Button";
import { ListChecks } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
    plan_mode: boolean;
    onToggle: () => void;
};

/**
 * Beside the composer's tools: turns Plan mode on for the next message, so
 * the bot plans and reads and changes nothing. Filled in the primary colour
 * while it is on, so the mode is unmistakable (the Tab key turns it on and
 * off anywhere on the page).
 */
export default function ComposerPlanButton({ plan_mode, onToggle }: Props) {
    return (
        <Button
            title={plan_mode ? "Plan mode is on: the bot plans and reads, and changes nothing (Tab turns it off)" : "Plan mode: the bot plans and reads, and changes nothing (Tab turns it on)"}
            type="button"
            variant={plan_mode ? "normal" : "ghost"}
            color={plan_mode ? "primary" : "gray"}
            size="small"
            aria-pressed={plan_mode}
            beforeIcon={<ListChecks size={12} aria-hidden />}
            onClick={onToggle}
            className={twMerge(
                "shrink-0 gap-1! px-2! py-0.5! text-[12px] leading-4",
                !plan_mode && "text-ink-secondary",
            )}
        >
            Plan
        </Button>
    );
}