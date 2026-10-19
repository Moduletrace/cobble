import { useContext } from "react";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { ChevronRight } from "lucide-react";
import UserAvatar from "@/src/components/general/user-avatar";
import { AppContext } from "@/src/pages/__root";
import RailUserMenu from "./rail-user-menu";
import Tag from "@moduletrace/twui/elements/Tag";

/**
 * The signed-in user, opening the popover above. Its top rule sits at the
 * same height as the composer rule, so the two read as one line.
 */
export default function RailUserRow() {
    const { user, user_types } = useContext(AppContext);

    const name = user?.first_name || user?.email || "";
    const initials = [user?.first_name, user?.last_name]
        .filter(Boolean)
        .map((part) => part!.charAt(0).toUpperCase())
        .join("");

    return (
        <Stack className="h-[88px] shrink-0 gap-0! items-stretch justify-center px-2 @rail:px-3 mx-0 @rail:mx-3 border-0 border-t border-solid border-hairline">
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
                        className="w-full h-12 gap-3! flex-nowrap items-center rounded-default px-1 @rail:px-0 cursor-pointer hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                    >
                        <UserAvatar
                            src={user?.image_thumbnail || user?.image}
                            img_err_src={user?.image}
                            initials={initials}
                            size="md"
                        />
                        <Stack className="hidden @rail:flex grow min-w-0 gap-1">
                            <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                                {name}
                            </Span>
                            <Row className="-mt-1">
                                {user_types?.map((ut, indx) => {
                                    return (
                                        <Tag
                                            key={indx}
                                            variant="ghost"
                                            color="gray"
                                            className="p-0!"
                                        >
                                            {ut.user_type}
                                        </Tag>
                                    );
                                })}
                            </Row>
                        </Stack>
                        <ChevronRight
                            size={16}
                            className="hidden @rail:block shrink-0 text-ink"
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
