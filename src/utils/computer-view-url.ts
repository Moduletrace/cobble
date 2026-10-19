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
 * `/computers/3/terminal`, with `{prefix}` in its path filled in.
 */
export default function computerViewUrl({ computer_id, mode }: Params) {
    const base = `${ComputerProxyPrefix}/${computer_id}/`;
    const path = ComputerViewModes.find((m) => m.value == mode)?.path || "";

    return `${base}${path.replace("{prefix}", base.replace(/^\//, ""))}`;
}
