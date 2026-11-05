import type { ComputerViewMode } from "@/src/dict/computer-dict";

type Params = {
    /**
     * The modes this user may open (`computerViewModesFor`), first is the
     * fallback.
     */
    modes: ReadonlyArray<{ value: ComputerViewMode }>;
    /**
     * The mode asked for (a take-over names one).
     */
    requested?: string;
    /**
     * The mode the computer was last viewed in on this device.
     */
    remembered?: string;
};

/**
 * The mode a computer view opens in: the one asked for, else the one it
 * was last viewed in, else the first, each only if the user may open it.
 */
export default function pickComputerViewMode({ modes, requested, remembered }: Params): ComputerViewMode {
    const allowed = (value?: string) => modes.find((mode) => mode.value == value)?.value;

    return allowed(requested) || allowed(remembered) || modes[0]!.value;
}
