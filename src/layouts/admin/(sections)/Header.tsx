import Row from "@moduletrace/twui/layout/Row";
import Button from "@moduletrace/twui/layout/Button";
import HeaderUser from "../../main/(partials)/header-user";
import LogoIcon from "@/src/components/general/logo-icon";
import MobileNav from "../(partials)/MobileNav";
import { ArrowUpRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {};

export default function Header({}: Props) {
    /**
     * Render component
     */
    return (
        <header className="h-16 border-b border-slate-200 dark:border-white/10">
            <Row
                className={twMerge(
                    "w-full justify-between h-full px-4 xl:px-10",
                    "flex-nowrap",
                )}
            >
                <Row className="flex-nowrap gap-3!">
                    <MobileNav />
                    <a href="/" className="flex xl:hidden">
                        <LogoIcon icon_size={28} />
                    </a>
                </Row>
                <Row className="flex-nowrap gap-3!">
                    <Button
                        title="View site"
                        href="/"
                        variant="ghost"
                        color="gray"
                        size="small"
                        afterIcon={<ArrowUpRight size={14} />}
                        className="text-sm hidden sm:flex"
                    >
                        View site
                    </Button>
                    <HeaderUser />
                </Row>
            </Row>
        </header>
    );
}
