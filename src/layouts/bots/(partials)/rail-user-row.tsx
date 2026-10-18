import { useContext } from "react";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { ChevronRight } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import RailUserMenu from "./rail-user-menu";

/**
 * The signed-in user, opening the popover above. Its top rule sits at the
 * same height as the composer rule, so the two read as one line.
 */
export default function RailUserRow() {
    const { pageProps } = useContext(AppContext);
    const user = pageProps?.user;

    const name = user?.first_name || user?.email || "";
    const initials = [user?.first_name, user?.last_name]
        .filter(Boolean)
        .map((part) => part!.charAt(0).toUpperCase())
        .join("");

    return (
        <Stack className="h-[88px] shrink-0 gap-0! items-stretch justify-center px-2 lg:px-3 mx-0 lg:mx-3 border-0 border-t border-solid border-hairline">
            <Dropdown
                position="top-left"
                className="w-full"
                targetWrapperProps={{ className: "w-full" }}
                target={
                    <Row
                        role="button"
                        tabIndex={0}
                        aria-haspopup="menu"
                        aria-label={`Account menu for ${name}`}
                        className="w-full h-12 gap-3! flex-nowrap items-center rounded-default px-1 lg:px-0 cursor-pointer hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                    >
                        <Span className="size-6 shrink-0 rounded-full bg-sunken flex items-center justify-center text-[11px] font-bold leading-none text-ink">
                            {initials}
                        </Span>
                        <Stack className="hidden lg:flex grow min-w-0 gap-0!">
                            <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                                {name}
                            </Span>
                            <Span className="text-[11px] leading-4 text-ink-secondary">
                                Free
                            </Span>
                        </Stack>
                        <ChevronRight
                            size={16}
                            className="hidden lg:block shrink-0 text-ink"
                            aria-hidden
                        />
                    </Row>
                }
            >
                <RailUserMenu />
            </Dropdown>
        </Stack>
    );
}
