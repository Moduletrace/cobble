import { AppData } from "@/src/data/app-data";

/**
 * Builds the computer image from `computer/` for this machine, tagged as
 * the image the app runs (`AppData.ComputerImage`), so a dev server or a
 * test install uses it without pulling. Extra arguments go to `docker
 * build` (e.g. `--pull`, `--no-cache`).
 */
const build = Bun.spawn(["docker", "build", "-t", AppData.ComputerImage, ...process.argv.slice(2), "computer"], {
    stdio: ["inherit", "inherit", "inherit"],
});

process.exit(await build.exited);
