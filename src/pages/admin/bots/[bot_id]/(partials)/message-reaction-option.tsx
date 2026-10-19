import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    value: string;
    onPick: () => void;
};

/**
 * One emoji in the reaction picker.
 */
export default function MessageReactionOption({ title, value, onPick }: Props) {
    return (
        <Button
            title={title}
            aria-label={`React with ${title}`}
            type="button"
            variant="ghost"
            color="text"
            onClick={onPick}
            className="shrink-0 px-2! py-1! rounded-default-xs hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Span className="text-base leading-5">{value}</Span>
        </Button>
    );
}
