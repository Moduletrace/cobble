import { useContext, useState } from "react";
import { twMerge } from "tailwind-merge";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ExternalLink } from "lucide-react";
import type { ComputerViewMode } from "@/src/dict/computer-dict";
import { AppContext } from "@/src/pages/__root";
import computerViewModesFor from "@/src/utils/computer-view-modes-for";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import computerViewUrl from "@/src/utils/computer-view-url";
import ComputerViewFrame from "./computer-view-frame";
import ComputerViewModeButton from "./computer-view-mode-button";

type Props = {
    computer_id: number;
    /**
     * The computer's name, for the frame titles.
     */
    name: string;
    /**
     * The mode it opens in.
     */
    default_mode?: ComputerViewMode;
    className?: string;
};

/**
 * A computer the user can work on: its screen (Chrome as it is), and its
 * shell for crew managers (`computerViewModesFor`), served through the app
 * (`/computers/<id>/`). The mode tabs show once there's more than one
 * mode; a mode stays open once visited, so switching back keeps its state.
 */
export default function ComputerView({ computer_id, name, default_mode, className }: Props) {
    const { user_types } = useContext(AppContext);
    const modes = computerViewModesFor({ can_manage_crew: canManageCrew({ user_types: user_types || [] }) });
    const [mode, setMode] = useState<ComputerViewMode>(
        modes.find((m) => m.value == default_mode)?.value || modes[0]!.value,
    );
    const [visited, setVisited] = useState<ComputerViewMode[]>([mode]);

    const pick = ({ value }: { value: ComputerViewMode }) => {
        setMode(value);
        setVisited((prev) => (prev.includes(value) ? prev : [...prev, value]));
    };

    return (
        <Stack className={twMerge("w-full min-h-0 gap-0! items-stretch", className)}>
            <Row className="w-full gap-1! flex-nowrap items-center px-3 py-2 border-0 border-b border-solid border-hairline">
                {modes.length > 1 ? (
                    <Row role="tablist" aria-label={`${name} modes`} className="gap-1! flex-nowrap">
                        {modes.map((item) => (
                            <ComputerViewModeButton
                                key={item.value}
                                title={item.title}
                                active={item.value == mode}
                                onPick={() => pick({ value: item.value })}
                            />
                        ))}
                    </Row>
                ) : (
                    <Span className="px-2 text-[13px] leading-[18px] font-bold text-ink">{modes[0]!.title}</Span>
                )}
                <Link
                    href={computerViewUrl({ computer_id, mode })}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in a new tab"
                    aria-label="Open in a new tab"
                    className="ml-auto p-2 text-ink-secondary hover:text-ink rounded-default hover:bg-sunken"
                >
                    <ExternalLink size={16} aria-hidden />
                </Link>
            </Row>
            <Stack className="relative grow min-h-0 gap-0! items-stretch bg-sunken">
                {visited.map((value) => (
                    <ComputerViewFrame
                        key={value}
                        computer_id={computer_id}
                        name={name}
                        mode={value}
                        active={value == mode}
                    />
                ))}
            </Stack>
        </Stack>
    );
}
