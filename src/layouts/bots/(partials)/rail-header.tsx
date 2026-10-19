import Row from "@moduletrace/twui/layout/Row";
import Link from "@moduletrace/twui/layout/Link";
import Wordmark from "@/src/components/general/wordmark";
import LogoIcon from "@/src/components/general/logo-icon";
import RailAddButton from "./rail-add-button";

type Props = {
    /**
     * Off on settings pages, where adding things is out of place.
     */
    show_add?: boolean;
};

export default function RailHeader({ show_add = true }: Props) {
    return (
        <Row className="h-[72px] shrink-0 gap-0! flex-nowrap items-start justify-center @rail:justify-between px-0 @rail:pl-5 @rail:pr-6 pt-5">
            <Link
                href="/admin/bots"
                className="border-0 mt-1 rounded-default-xs hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
                <Wordmark height={15} className="hidden @rail:block" />
                <LogoIcon icon_size={28} img_props={{ className: "@rail:hidden" }} />
            </Link>
            {show_add ? <RailAddButton /> : null}
        </Row>
    );
}
