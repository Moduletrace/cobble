import { AppData } from "@/src/data/app-data";
import inspectDockerContainer from "./inspect-docker-container";

type Params = {
    /**
     * The container's id or name.
     */
    container: string;
};

/**
 * Waits until a container's health check passes (`running`), checking
 * every `AppData.ComputerHealthPollMs` for at most
 * `AppData.ComputerHealthyTimeoutMs`, and returns its state. Throws when
 * it turns unhealthy, stops, or takes too long.
 */
export default async function waitForHealthyContainer({ container }: Params) {
    const deadline = Date.now() + AppData.ComputerHealthyTimeoutMs;

    while (true) {
        const state = await inspectDockerContainer({ container });

        if (state?.status == "running") return state;

        if (!state || !["starting", "created", "restarting"].includes(state.status)) {
            throw new Error(`The container is ${state?.status || "gone"} instead of passing its health check.`);
        }

        if (Date.now() > deadline) {
            throw new Error(
                `The container didn't pass its health check within ${Math.round(AppData.ComputerHealthyTimeoutMs / 60000)} minutes.`,
            );
        }

        await Bun.sleep(AppData.ComputerHealthPollMs);
    }
}
