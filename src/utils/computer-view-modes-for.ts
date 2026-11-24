import { ComputerViewModes, SshTerminalViewMode, type ComputerConnection } from "@/src/dict/computer-dict";

type Params = {
    /**
     * `canManageCrew`: crew managers get the `crew_only` modes too.
     */
    can_manage_crew: boolean;
    /**
     * An SSH computer has only its shell.
     */
    connection?: ComputerConnection | "";
};

/**
 * The ways this user may open a computer (`ComputerViewModes`), Browser
 * first; an SSH server has its terminal alone.
 */
export default function computerViewModesFor({ can_manage_crew, connection }: Params) {
    if (connection == "ssh") return [SshTerminalViewMode];

    return ComputerViewModes.filter((mode) => can_manage_crew || !mode.crew_only);
}
