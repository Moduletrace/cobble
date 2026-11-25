import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { ComposerCommand } from "../(data)/composer-commands";

type Props = {
    command: ComposerCommand;
    active: boolean;
    onPick: (command: ComposerCommand) => void;
};

/**
 * One slash command in the composer's command list, with what it does.
 */
export default function ComposerCommandOption({ command, active, onPick }: Props) {
    return (
        <Button
            type="button"
            variant="ghost"
            color="text"
            role="option"
            aria-selected={active}
            title={`/${command.name}`}
            onMouseDown={(e) => {
                e.preventDefault();
                onPick(command);
            }}
            className={twMerge(
                "w-full justify-start! gap-2.5! px-2! py-1.5! rounded-default-sm text-left text-ink",
                active && "bg-sunken",
            )}
        >
            <Span className="shrink-0 text-sm font-bold leading-5">{`/${command.name}`}</Span>
            <Span className="min-w-0 truncate text-xs leading-4 text-ink-secondary">{command.description}</Span>
        </Button>
    );
}