import { twMerge } from "tailwind-merge";

type Props = {
    /**
     * The colour as `#rrggbb`; `input[type=color]` only takes that form.
     */
    color: string;
    disabled?: boolean;
    title: string;
    onChange: (color: string) => void;
};

/**
 * The native colour picker, dressed as a swatch. twui has no colour input,
 * and its `Input` wraps every type in a padded field with a clear button,
 * which a swatch doesn't want, so this is the field itself. The value goes
 * straight into the same `onChange` the hex field and the tiles use.
 */
export default function BotColourSwatch({ color, disabled, title, onChange }: Props) {
    return (
        <input
            type="color"
            title={title}
            aria-label={title}
            value={color}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={twMerge(
                "size-9 shrink-0 cursor-pointer appearance-none rounded-default",
                "border border-solid border-hairline bg-surface p-0.5",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                "disabled:cursor-not-allowed disabled:opacity-50",
            )}
        />
    );
}
