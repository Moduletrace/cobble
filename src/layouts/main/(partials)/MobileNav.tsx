import React from "react";
import ReactDOM from "react-dom";
import { Menu, X } from "lucide-react";
import Stack from "@moduletrace/twui/layout/Stack";
import { MainLinks } from "@/src/dict/main-links-dict";
import LinkList from "@moduletrace/twui/elements/LinkList";
import HeaderCTA from "./header-cta";
import Row from "@moduletrace/twui/layout/Row";
import Logo from "@/src/components/general/logo";
import { twMerge } from "tailwind-merge";
import MobileNavThemeRow from "@/src/components/general/mobile-nav-theme-row";

export default function MobileNav() {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        if (!open) return;

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="flex xl:hidden relative">
            <button
                type="button"
                aria-label="Open menu"
                aria-expanded={open}
                className="cursor-pointer p-1 text-dark dark:text-white"
                onClick={() => setOpen(true)}
            >
                <Menu size={26} />
            </button>

            {open
                ? ReactDOM.createPortal(
                    <div
                        className={twMerge(
                            "fixed inset-0 z-200 flex flex-col",
                            "bg-light text-dark dark:bg-background-dark dark:text-white",
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation"
                        onClick={(e) => {
                            if ((e.target as HTMLElement).closest("a")) {
                                setOpen(false);
                            }
                        }}
                    >
                        <Row
                            className={twMerge(
                                "w-full justify-between items-center flex-nowrap",
                                "px-4 sm:px-10 py-4 border-b",
                                "border-slate-200/70 dark:border-white/10",
                            )}
                        >
                            <Logo icon_size={28} />
                            <button
                                type="button"
                                aria-label="Close menu"
                                className="cursor-pointer p-1 text-dark dark:text-white"
                                onClick={() => setOpen(false)}
                            >
                                <X size={26} />
                            </button>
                        </Row>

                        <Stack className="grow w-full items-stretch px-4 sm:px-10 py-6 gap-8! overflow-y-auto">
                            <nav className="w-full">
                                <LinkList
                                    links={MainLinks}
                                    className="flex-col items-stretch gap-1 w-full"
                                    linkProps={{
                                        className: twMerge(
                                            "px-0 py-4 w-full text-lg border-0",
                                            "text-slate-600 hover:text-dark",
                                            "dark:text-slate-300 dark:hover:text-white",
                                        ),
                                    }}
                                />
                            </nav>
                            <HeaderCTA className="flex flex-col w-full items-stretch" />
                        </Stack>

                        <MobileNavThemeRow className="px-4 sm:px-10 py-4" />
                    </div>,
                    document.body,
                )
                : null}
        </div>
    );
}
