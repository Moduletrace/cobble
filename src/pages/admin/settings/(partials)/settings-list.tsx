import type { ReactNode } from "react";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    children: ReactNode;
    /**
     * Shown instead when the list has no rows.
     */
    empty?: string;
    is_empty?: boolean;
};

/**
 * A framed list of rows inside a settings group.
 */
export default function SettingsList({ children, empty, is_empty }: Props) {
    return (
        <Stack className="w-full py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface">
            {children}
            {is_empty && empty ? (
                <Span className="px-4 py-4 text-[13px] leading-[18px] text-ink-secondary">{empty}</Span>
            ) : null}
        </Stack>
    );
}
