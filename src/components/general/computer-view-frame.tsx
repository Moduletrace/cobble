import { ComputerViewModes, type ComputerViewMode } from "@/src/dict/computer-dict";
import computerViewUrl from "@/src/utils/computer-view-url";

type Props = {
    computer_id: number;
    name: string;
    mode: ComputerViewMode;
    /**
     * The mode on show; the others stay loaded but hidden.
     */
    active: boolean;
};

/**
 * One of a computer's apps in a frame. A raw iframe: twui has no
 * equivalent.
 */
export default function ComputerViewFrame({ computer_id, name, mode, active }: Props) {
    const title = ComputerViewModes.find((m) => m.value == mode)?.title || mode;

    return (
        <iframe
            src={computerViewUrl({ computer_id, mode })}
            title={`${name}: ${title}`}
            allow="clipboard-read; clipboard-write; fullscreen"
            className={`absolute inset-0 w-full h-full border-0 bg-sunken ${active ? "" : "hidden"}`}
        />
    );
}
