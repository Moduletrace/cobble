import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import ColorSchemeSelector from "@moduletrace/twui/elements/ColorSchemeSelector";
import { twMerge } from "tailwind-merge";

type Props = {
    className?: string;
};

/**
 * Theme switch row pinned to the bottom of the mobile navs.
 */
export default function MobileNavThemeRow({ className }: Props) {
    return (
        <Row
            className={twMerge(
                "w-full justify-between items-center flex-nowrap",
                "border-t border-slate-200/70 dark:border-white/10",
                className,
            )}
        >
            <Span className="text-sm text-slate-500 dark:text-slate-400">
                Theme
            </Span>
            <ColorSchemeSelector
                className="text-slate-500 hover:text-foreground-light dark:text-slate-400 dark:hover:text-foreground-dark transition-colors"
                size="small"
            />
        </Row>
    );
}
