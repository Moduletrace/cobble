import { ComputerViewModes } from "@/src/dict/computer-dict";

type Params = {
    /**
     * `canManageCrew`: crew managers get the `crew_only` modes too.
     */
    can_manage_crew: boolean;
};

/**
 * The ways this user may open a computer (`ComputerViewModes`), Browser
 * first.
 */
export default function computerViewModesFor({ can_manage_crew }: Params) {
    return ComputerViewModes.filter((mode) => can_manage_crew || !mode.crew_only);
}
