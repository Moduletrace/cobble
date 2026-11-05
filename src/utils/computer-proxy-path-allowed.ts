import computerViewModesFor from "./computer-view-modes-for";

type Params = {
    /**
     * The path on the computer (`parseComputerProxyPath`'s `rest`, no
     * leading slash).
     */
    rest: string;
    can_manage_crew: boolean;
};

/**
 * Whether the app's proxy passes a path on to a computer: only the views
 * this user may open (`computerViewModesFor`), never the agent's API or
 * Playwright MCP, which only the app's own tools call, with the run's
 * folder rules.
 */
export default function computerProxyPathAllowed({ rest, can_manage_crew }: Params) {
    return computerViewModesFor({ can_manage_crew }).some(
        ({ path }) => rest == path.replace(/\/$/, "") || (rest.startsWith(path) && !rest.split("/").includes("..")),
    );
}
