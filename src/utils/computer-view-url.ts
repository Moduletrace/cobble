import {
    ComputerProxyPrefix,
    ComputerViewModes,
    type ComputerViewMode,
} from "@/src/dict/computer-dict";

type Params = {
    computer_id: number | string;
    mode: ComputerViewMode;
};

/**
 * The app address of one of a computer's modes, e.g.
 * `/computers/3/terminal`.
 */
export default function computerViewUrl({ computer_id, mode }: Params) {
    const path = ComputerViewModes.find((m) => m.value == mode)?.path || "";

    return `${ComputerProxyPrefix}/${computer_id}/${path}`;
}
