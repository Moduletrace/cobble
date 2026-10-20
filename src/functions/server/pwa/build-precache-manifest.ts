import path from "path";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import type { PrecacheManifest } from "@/src/types";

type Params = {
    /**
     * bunext's build directory (`.bunext`).
     */
    bunext_dir: string;
};

/**
 * Lists every file of one bunext build's `public/` directory as the path
 * the browser asks for (`/.bunext/public/...`), with the build's id, so
 * the service worker can download the whole build before the app runs.
 * Null without a build.
 */
export default function buildPrecacheManifest({
    bunext_dir,
}: Params): PrecacheManifest | null {
    const public_dir = path.join(bunext_dir, "public");
    const build_info_path = path.join(bunext_dir, "build-info.json");

    if (!existsSync(public_dir) || !existsSync(build_info_path)) return null;

    const build_id = JSON.parse(readFileSync(build_info_path, "utf-8"))
        ?.build_id as string | undefined;

    if (!build_id) return null;

    const files: string[] = [];

    const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
            const full_path = path.join(dir, name);

            if (statSync(full_path).isDirectory()) {
                walk(full_path);
                continue;
            }

            const relative = path
                .relative(bunext_dir, full_path)
                .split(path.sep)
                .join("/");

            files.push(`/.bunext/${relative}`);
        }
    };

    walk(public_dir);
    files.sort();

    return { build_id, files };
}
