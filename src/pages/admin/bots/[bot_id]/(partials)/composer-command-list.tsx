import Stack from "@moduletrace/twui/layout/Stack";
import type { ComposerCommand } from "../(data)/composer-commands";
import ComposerCommandOption from "./composer-command-option";

type Props = {
    commands: ComposerCommand[];
    index: number;
    onPick: (command: ComposerCommand) => void;
};

/**
 * The slash commands matching what's typed, just above the composer's
 * input. Up and Down move, Enter runs the highlighted one; a click fills
 * the input with it.
 */
export default function ComposerCommandList({ commands, index, onPick }: Props) {
    return (
        <Stack
            role="listbox"
            aria-label="Commands"
            className="w-full max-w-container mx-auto gap-0.5! items-stretch px-3 md:px-6 pt-3"
        >
            <Stack className="gap-0.5! items-stretch p-1 rounded-default border border-solid border-hairline bg-surface shadow-popover">
                {commands.map((command, command_index) => (
                    <ComposerCommandOption
                        key={command.name}
                        command={command}
                        active={command_index == index}
                        onPick={onPick}
                    />
                ))}
            </Stack>
        </Stack>
    );
}