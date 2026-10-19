import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { AddChoice } from "../(dict)/add-choices-dict";

type Props = AddChoice & {
    onPick: () => void;
};

/**
 * One thing the Add modal can add: icon, name and what it is.
 */
export default function AddChoiceRow({ title, description, Icon, onPick }: Props) {
    return (
        <Button
            title={`Add a ${title.toLowerCase()}`}
            type="button"
            variant="ghost"
            color="text"
            onClick={onPick}
            className="w-full justify-start! items-start! gap-3! px-3! py-3! rounded-default text-left text-ink dark:text-ink hover:bg-sunken hover:dark:bg-sunken focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Span className="size-8 shrink-0 flex items-center justify-center rounded-default-sm border border-solid border-hairline bg-surface">
                <Icon size={16} aria-hidden />
            </Span>
            <Stack className="min-w-0 gap-0! items-start">
                <Span className="text-sm font-bold leading-5 text-ink">{title}</Span>
                <Span className="text-[13px] leading-[18px] text-ink-secondary whitespace-normal">
                    {description}
                </Span>
            </Stack>
        </Button>
    );
}
