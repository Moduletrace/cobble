import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import type { ComposerMentionMenu } from "../(hooks)/use-composer-editor";
import ComposerMentionOption from "./composer-mention-option";

type Props = {
    menu: ComposerMentionMenu;
};

/**
 * The bots (`@`) or workspaces (`#`) matching what's typed, just above
 * the composer's input. Up and Down move, Enter or Tab picks, Escape
 * closes; a click picks too.
 */
export default function ComposerMentionList({ menu }: Props) {
    return (
        <Stack
            role="listbox"
            aria-label={menu.char == "#" ? "Workspaces" : "Bots"}
            className="w-full max-w-container mx-auto gap-0.5! items-stretch px-3 md:px-6 pt-3"
        >
            <Stack className="gap-0.5! items-stretch p-1 rounded-default border border-solid border-hairline bg-surface shadow-popover">
                {menu.items.length ? (
                    menu.items.map((item, index) => (
                        <ComposerMentionOption
                            key={item.id}
                            item={item}
                            active={index == menu.index}
                            onPick={menu.select}
                        />
                    ))
                ) : (
                    <Span className="px-2 py-1.5 text-xs leading-4 text-ink-secondary">
                        {menu.char == "#" ? "No workspace by that name" : "No bot by that name"}
                    </Span>
                )}
            </Stack>
        </Stack>
    );
}
