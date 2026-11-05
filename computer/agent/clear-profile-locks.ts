import { readdirSync, rmSync } from "node:fs";
import path from "node:path";

/**
 * Removes the `Singleton*` links a browser leaves in its profile when it
 * was stopped uncleanly (the container killed): another container's
 * hostname in them makes Chrome refuse the profile. Only called while no
 * browser runs.
 */
export default function clearProfileLocks({ profile_dir }: { profile_dir: string }) {
    let names: string[] = [];

    try {
        names = readdirSync(profile_dir);
    } catch {
        return;
    }

    for (const name of names) {
        if (name.startsWith("Singleton")) rmSync(path.join(profile_dir, name), { force: true });
    }
}
