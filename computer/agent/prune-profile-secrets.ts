import { readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import log from "./log";

/**
 * Where a browser profile keeps the passwords it has saved, in the profile
 * folder and in each profile's own folder (`Default`, `Profile 1`, ...):
 * the login database, its journal and backup, plus the web data file that
 * holds the account-wide copies Chrome syncs. Deleting these at every start
 * is what keeps a password out of a bot's reach: a browser here holds the
 * user's own logins (Gmail among them) as cookies, and it never needs a
 * saved password for that.
 */
const SecretProfileFiles = [
    "Login Data",
    "Login Data For Account",
    "Account Web Data",
    "Web Data",
];

/**
 * The side files SQLite leaves beside a database.
 */
const SideSuffixes = ["-journal", "-wal", "-shm", ""];

/**
 * Deletes the saved-password stores from a browser profile.
 *
 * A page's login form can be filled from here by Chrome itself, and the
 * result reaches a model as page text (a snapshot reported a mailbox
 * password in the clear, and it was repeated in a message and a question).
 * Site cookies, history, extensions and site permissions are not touched:
 * deleting these files signs the browser out of no site.
 *
 * Only called while no browser runs (a file deleted under a live Chrome is
 * still open, and Chrome writes it back when it exits). Returns how many
 * files it removed.
 */
export default function pruneProfileSecrets({ profile_dir }: { profile_dir: string }) {
    let removed = 0;

    for (const profile of safeReadDir({ target: profile_dir })) {
        if (!/^(Default|Profile \d+|System Profile)$/.test(profile)) continue;

        for (const name of SecretProfileFiles) {
            for (const suffix of SideSuffixes) {
                const target = path.join(profile_dir, profile, `${name}${suffix}`);

                if (!isFile({ target })) continue;

                try {
                    rmSync(target, { force: true });
                    removed++;
                } catch {
                    /**
                     * One that can't be removed (a permission problem) is
                     * left for the next start; the browser comes up either
                     * way.
                     */
                }
            }
        }
    }

    if (removed > 0) log({ name: "browser", message: `removed ${removed} saved login file${removed == 1 ? "" : "s"}` });

    return removed;
}

function isFile({ target }: { target: string }) {
    try {
        return statSync(target).isFile();
    } catch {
        return false;
    }
}

function safeReadDir({ target }: { target: string }) {
    try {
        return readdirSync(target);
    } catch {
        return [];
    }
}