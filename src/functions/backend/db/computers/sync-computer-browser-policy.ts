import { AppData } from "@/src/data/app-data";
import execDockerContainer from "@/src/functions/backend/docker/exec-docker-container";
import { logError } from "@/src/functions/backend/logger";
import computerBrowserPolicy from "@/src/utils/computer-browser-policy";

type Params = {
    computer_id: number | string;
    /**
     * The computer's running container.
     */
    docker_id: string;
};

/**
 * Writes the browser policy (`computerBrowserPolicy`: the extensions every
 * computer gets) into a running computer's container at
 * `AppData.ComputerBrowserPolicyFile`, as root, only when it differs.
 * Chrome watches that folder, so a running browser installs them without
 * a restart. The file lives in the container, not on a mount, so a running
 * computer gets it without being recreated; `provisionComputer` and the
 * `sync-computers` cron write it again. Never throws.
 */
export default async function syncComputerBrowserPolicy({ computer_id, docker_id }: Params) {
    const file = AppData.ComputerBrowserPolicyFile;

    try {
        const { exit_code } = await execDockerContainer({
            container: docker_id,
            cmd: [
                "sh",
                "-c",
                `[ "$(cat "$POLICY_FILE" 2>/dev/null)" = "$(printf '%s' "$POLICY")" ] && exit 0
                mkdir -p "$(dirname "$POLICY_FILE")" && printf '%s' "$POLICY" > "$POLICY_FILE.tmp" && chmod 644 "$POLICY_FILE.tmp" && mv "$POLICY_FILE.tmp" "$POLICY_FILE"`,
            ],
            env: [`POLICY_FILE=${file}`, `POLICY=${computerBrowserPolicy()}`],
        });

        if (exit_code !== 0) throw new Error(`Writing ${file} exited with ${exit_code}.`);

        return true;
    } catch (error) {
        await logError({ title: `Computer #${computer_id} couldn't get its browser policy`, error }).catch(() => {});
        return false;
    }
}
