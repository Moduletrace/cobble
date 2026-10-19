import { useState } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import { ExternalLink } from "lucide-react";
import { ComputerViewModes, type ComputerViewMode } from "@/src/dict/computer-dict";
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
 * A computer the user can work on: its browser, terminal or code editor
 * (`ComputerViewModes`), served through the app (`/computers/<id>/`).
 * A mode stays open once visited, so switching back keeps its state.
 */
export default function ComputerView({ computer_id, name, default_mode, className }: Props) {
    const [mode, setMode] = useState<ComputerViewMode>(
        default_mode || ComputerViewModes[0].value,
    );
    const [visited, setVisited] = useState<ComputerViewMode[]>([mode]);

    const pick = ({ value }: { value: ComputerViewMode }) => {
        setMode(value);
        setVisited((prev) => (prev.includes(value) ? prev : [...prev, value]));
    };

    return (
        <Stack className={`w-full min-h-0 gap-0! items-stretch ${className || ""}`}>
            <Row className="w-full gap-1! flex-nowrap items-center px-3 py-2 border-0 border-b border-solid border-hairline">
                <Row role="tablist" aria-label={`${name} modes`} className="gap-1! flex-nowrap">
                    {ComputerViewModes.map((item) => (
                        <ComputerViewModeButton
                            key={item.value}
                            title={item.title}
                            active={item.value == mode}
                            onPick={() => pick({ value: item.value })}
                        />
                    ))}
                </Row>
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
