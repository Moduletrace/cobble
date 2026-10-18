import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { RailUserMenuItem } from "../(dict)/rail-user-menu-dict";

const RowClassName =
    "w-full h-9 gap-2.5! flex-nowrap items-center px-4";

export default function RailUserMenuEntry({ title, url, Icon }: RailUserMenuItem) {
    if (!url) {
        return (
            <Row
                role="menuitem"
                aria-disabled="true"
                title={`${title} is not available yet`}
                className={`${RowClassName} text-ink-disabled cursor-not-allowed`}
            >
                <Icon size={16} aria-hidden />
                <Span className="text-sm leading-5">{title}</Span>
            </Row>
        );
    }

    return (
        <Link
            href={url}
            role="menuitem"
            className="block w-full border-0 leading-normal hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
        >
            <Row className={`${RowClassName} text-ink`}>
                <Icon size={16} aria-hidden />
                <Span className="text-sm leading-5 text-ink">{title}</Span>
            </Row>
        </Link>
    );
}
