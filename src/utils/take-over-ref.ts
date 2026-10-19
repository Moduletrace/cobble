import type { ComputerViewMode } from "@/src/dict/computer-dict";

type Params = {
    id: number | string;
    mode: ComputerViewMode;
};

/**
 * How a bot asks the user to take over one of its computers in a message:
 * `[take-over:3:browser]`. The chat shows it as a button that opens the
 * computer in that mode.
 */
export default function takeOverRef({ id, mode }: Params) {
    return `[take-over:${id}:${mode}]`;
}
