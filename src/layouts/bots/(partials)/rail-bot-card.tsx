import Stack from "@moduletrace/twui/layout/Stack";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
    /**
     * Groups the open bot's row with its sessions, so the active background
     * covers both and the sessions read as belonging to that bot.
     */
    selected?: boolean;
    children: ReactNode;
};

export default function RailBotCard({ selected, children }: Props) {
    return (
        <Stack
            className={twMerge(
                "w-full shrink-0 flex-col gap-0! items-stretch rounded-default py-1",
                selected && "bg-ink/5",
            )}
        >
            {children}
        </Stack>
    );
}
