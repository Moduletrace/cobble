import { useContext, useState } from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import Button from "@moduletrace/twui/layout/Button";
import LinkList from "@moduletrace/twui/elements/LinkList";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import type { AdminAsideLinkItem } from "../(dict)/admin-aside-groups-dict";
import adminAsideLinkToTwuiLink from "../(functions)/admin-aside-link-to-twui-link";

type Props = {
    link: AdminAsideLinkItem;
};

export default function AdminAsideLinkDropdown({ link }: Props) {
    const { pageProps } = useContext(AppContext);
    const { title, url, Icon, children } = link;

    const is_current = Boolean(pageProps?.url?.pathname?.startsWith(url));
    const [open, setOpen] = useState(is_current);

    return (
        <Stack className="w-full items-stretch gap-0.5!">
            <Button
                title={title}
                variant="ghost"
                color="gray"
                aria-expanded={open}
                className={twMerge(
                    "w-full justify-start px-3 py-2 font-normal",
                    "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 hover:opacity-100",
                    "dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
                    is_current ? "text-slate-900 dark:text-white" : "",
                )}
                buttonContentProps={{ className: "w-full" }}
                onClick={() => setOpen(!open)}
            >
                <Row className="w-full flex-nowrap">
                    <Icon
                        size={16}
                        strokeWidth={1.75}
                        className={
                            is_current
                                ? "text-accent"
                                : "text-slate-400 dark:text-slate-500"
                        }
                    />
                    {title}
                    <ChevronDown
                        size={14}
                        strokeWidth={1.75}
                        className={twMerge(
                            "ml-auto text-slate-400 transition-transform",
                            open ? "rotate-180" : "",
                        )}
                    />
                </Row>
            </Button>
            {open ? (
                <LinkList
                    links={(children || []).map((child) =>
                        adminAsideLinkToTwuiLink({ link: child }),
                    )}
                    className="flex-col items-stretch gap-0.5 ml-5 pl-2 border-l border-slate-200 dark:border-white/10"
                />
            ) : null}
        </Stack>
    );
}
