import { AppData } from "@/src/data/app-data";
import computerWorkerAccount from "@/src/utils/computer-worker-account";
import shellQuote from "@/src/utils/shell-quote";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";

/**
 * Where a run's caches go: the account's own home inside the container
 * (`/home/cb-<bot>/.cache`, `/home/gem/.cache`), never the run's folder.
 *
 * A run's `HOME` is its folder on the computer's mounted workspace
 * (`computerDirsShell`), because that is where its work must land. With no
 * cache home set, everything pip, npm, bun and Python cache on the side
 * went there too and was kept forever: one install's data volume held
 * 368 MB of npm cache, 188 MB of pip and headless-Chromium caches and
 * 53 MB of bun's install cache, against 178 MB of real bot files, and a
 * data archive carried all of it. Caches are rebuilt on demand, so they
 * belong in the part of the home a new container starts without.
 */
export default function computerCacheEnv({ dirs }: { dirs: ComputerRunDirs }) {
    const home = dirs.run_as
        ? computerWorkerAccount({ bot_id: dirs.run_as.bot_id }).home
        : AppData.ComputerHomeDir;
    const cache_home = `${home}/.cache`;

    /**
     * Each tool reads its own variable: `XDG_CACHE_HOME` covers what
     * follows the convention (Playwright's browsers, Chromium's headless
     * profile, pip's http cache), the rest name their cache directly.
     * `NPM_CONFIG_PREFIX` stays on `$HOME/.local` (`computerDirsShell`),
     * since installed packages have to survive a recreate.
     */
    const assignments = [
        `XDG_CACHE_HOME=${shellQuote({ text: cache_home })}`,
        `npm_config_cache=${shellQuote({ text: `${cache_home}/npm` })}`,
        `PIP_CACHE_DIR=${shellQuote({ text: `${cache_home}/pip` })}`,
        `BUN_INSTALL_CACHE_DIR=${shellQuote({ text: `${cache_home}/bun` })}`,
        `PYTHONPYCACHEPREFIX=${shellQuote({ text: `${cache_home}/pycache` })}`,
    ].join(" ");

    return { cache_home, assignments };
}