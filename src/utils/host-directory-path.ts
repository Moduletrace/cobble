import path from "node:path";
import { HostDirectorySourceMaxChars } from "@/src/dict/host-directory-dict";
import AppError from "./app-error";

/**
 * Parts of the host that can't be mounted into a computer: its own
 * machinery (which Docker would expose to a bot) and the daemon's state,
 * which a mount would let a run edit. Everything else is the user's to
 * choose, read only if they only want it read.
 */
const ReservedPaths = ["/proc", "/sys", "/dev", "/run", "/boot", "/var/lib/docker"];

type Params = {
    /**
     * A path on the host machine, as the user typed it.
     */
    source: string;
    /**
     * More paths to refuse, the install's own: its data volume and backups
     * (`hostDirectoryPath` is called with them).
     */
    reserved?: string[];
};

/**
 * The one shape a host directory's source is stored in: absolute, no
 * trailing slash, no `.` or `..`, not the whole host and not part of the
 * host's own system. A path Docker is handed as it is, so this is where a
 * typo would otherwise become a folder Docker makes as root, or a mount
 * over `/proc`.
 */
export default function hostDirectoryPath({ source, reserved = [] }: Params) {
    const text = String(source ?? "").trim();

    if (!text) throw new AppError("A host directory needs a path on the host machine.");

    if (text.length > HostDirectorySourceMaxChars) {
        throw new AppError(
            `A host directory's path can be at most ${HostDirectorySourceMaxChars} characters long.`
        );
    }

    if (/[\0\n\r]/.test(text)) {
        throw new AppError("A host directory's path can't hold a line break or a null character.");
    }

    if (!text.startsWith("/")) {
        throw new AppError("A host directory's path must be absolute, starting with /.");
    }

    if (text.split("/").includes("..")) {
        throw new AppError("A host directory's path can't climb up with ..; write the full path instead.");
    }

    const normalized = path.posix.normalize(text).replace(/\/+$/, "") || "/";

    if (normalized == "/") {
        throw new AppError("The whole host machine can't be mounted; pick the folder the bots should work in.");
    }

    for (const blocked of [...ReservedPaths, ...reserved]) {
        const clean = path.posix.normalize(String(blocked).trim());

        if (normalized == clean || normalized.startsWith(`${clean}/`)) {
            throw new AppError(
                `${normalized} is part of the host's own system, so it can't be mounted. Pick a folder you keep files in.`
            );
        }
    }

    return normalized;
}