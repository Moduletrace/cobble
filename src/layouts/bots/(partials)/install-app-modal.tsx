"use client";

import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import { Share, SquarePlus } from "lucide-react";
import { SiteData } from "@/src/data/site-data";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

const Steps = [
    {
        Icon: Share,
        title: "Open the Share menu",
        description: "In Safari it is the square with an arrow pointing up, in the toolbar.",
    },
    {
        Icon: SquarePlus,
        title: "Choose Add to Home Screen",
        description: "Scroll the list if it is not there. Then tap Add.",
    },
];

/**
 * Safari on iOS has no install event, so installation is the Share menu.
 */
export default function InstallAppModal({ open, setOpen }: Props) {
    return (
        <Modal
            open={open}
            setOpen={(next) => setOpen(typeof next == "function" ? next(open) : next)}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    Install {SiteData["SiteName"]}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    Installed, it opens in its own window and can send
                    notifications. Safari installs it from the Share menu.
                </Span>
            </Stack>
            <Stack className="w-full mt-5 gap-4! items-stretch">
                {Steps.map((step) => (
                    <Row
                        key={step.title}
                        className="gap-3! flex-nowrap items-start"
                    >
                        <Row className="size-9 shrink-0 items-center justify-center rounded-default bg-sunken">
                            <step.Icon size={17} aria-hidden className="text-ink" />
                        </Row>
                        <Stack className="gap-0.5! min-w-0">
                            <Span className="text-sm font-bold leading-5 text-ink">
                                {step.title}
                            </Span>
                            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                                {step.description}
                            </Span>
                        </Stack>
                    </Row>
                ))}
            </Stack>
        </Modal>
    );
}
