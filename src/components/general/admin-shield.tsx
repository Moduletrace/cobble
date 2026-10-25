import { ShieldCheck } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
    /**
     * Its size in pixels; 14 sits beside a 14px name.
     */
    size?: number;
    /**
     * The tooltip and accessible name.
     */
    label?: string;
    className?: string;
};

/**
 * The mark of a workspace's admin bot: a filled success-green shield with
 * its check cut out in the background's colour, set beside the bot's name
 * (never on its stone, which takes no badges). A role, not a status, and
 * never the bot's own colour.
 */
export default function AdminShield({
    size = 17,
    label = "Workspace admin",
    className,
}: Props) {
    return (
        <ShieldCheck
            size={size}
            role="img"
            aria-label={label}
            className={twMerge(
                "shrink-0 inline-block align-middle",
                "fill-success text-on-ink dark:fill-success-dark",
                className,
            )}
        >
            <title>{label}</title>
        </ShieldCheck>
    );
}
