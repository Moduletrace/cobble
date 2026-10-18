import React from "react";
import { Menu, X } from "lucide-react";
import AdminAsideLinks from "./admin-aside-links-dict";
import Row from "@moduletrace/twui/layout/Row";
import LogoIcon from "@/src/components/general/logo-icon";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";
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
        <div className="flex xl:hidden">
            <button
                type="button"
                aria-label="Open menu"
                aria-expanded={open}
                className="cursor-pointer p-1"
                onClick={() => setOpen(true)}
            >
                <Menu size={22} strokeWidth={1.75} />
            </button>

            {open ? (
                <>
                    <div
                        className="fixed inset-0 z-200 bg-dark/40 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                        aria-hidden
                    />
                    <aside
                        data-admin-nav
                        className={twMerge(
                            "fixed top-0 left-0 bottom-0 z-210",
                            "w-[min(280px,85vw)] bg-light dark:bg-black",
                            "flex flex-col shadow-xl",
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Admin navigation"
                    >
                        <Row className="w-full justify-between items-center px-6 h-16 flex-nowrap">
                            <a href="/" onClick={() => setOpen(false)}>
                                <LogoIcon icon_size={28} />
                            </a>
                            <button
                                type="button"
                                aria-label="Close menu"
                                className="cursor-pointer p-1"
                                onClick={() => setOpen(false)}
                            >
                                <X size={22} strokeWidth={1.75} />
                            </button>
                        </Row>
                        <Stack
                            className="w-full grow overflow-y-auto px-3 py-4"
                            onClick={(e) => {
                                if ((e.target as HTMLElement).closest("a")) {
                                    setOpen(false);
                                }
                            }}
                        >
                            <AdminAsideLinks />
                        </Stack>
                        <MobileNavThemeRow className="px-6 py-4" />
                    </aside>
                </>
            ) : null}
        </div>
    );
}
