import Row from "@moduletrace/twui/layout/Row";
import Link from "@moduletrace/twui/layout/Link";
import Wordmark from "@/src/components/general/wordmark";
import LogoIcon from "@/src/components/general/logo-icon";
import RailAddButton from "./rail-add-button";
import { twMerge } from "tailwind-merge";
import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import Logo from "@/src/components/general/logo";

type Props = {
    /**
     * Off on settings pages, where adding things is out of place.
     */
    show_add?: boolean;
};

export default function RailHeader({ show_add = true }: Props) {
    const { pageProps } = useContext(AppContext);

    return (
        <Row
            className={twMerge(
                "h-16 shrink-0 gap-0! flex-nowrap justify-center @rail:justify-between",
                "px-0 @rail:pl-5 @rail:pr-6 py-1 border-0 border-b border-solid border-hairline",
                "mb-6 w-full",
            )}
        >
            <Link
                href="/admin/bots"
                className={twMerge(
                    "border-0 mt-1 rounded-default-xs hover:opacity-100 focus-visible:ring-2",
                    "focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                )}
            >
                {pageProps?.url?.pathname.startsWith(`/admin/bots/`) ? (
                    <>
                        <Wordmark height={15} className="hidden @rail:block" />
                        <LogoIcon
                            icon_size={28}
                            img_props={{ className: "@rail:hidden" }}
                        />
                    </>
                ) : (
                    <>
                        <Logo icon_size={28} no_link />
                    </>
                )}
            </Link>
            {show_add ? <RailAddButton /> : null}
        </Row>
    );
}
