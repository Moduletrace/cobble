import { lstatSync, readdirSync } from "node:fs";
import path from "node:path";

type Params = {
    dir: string;
};

/**
 * Every regular file under a directory, depth first. Links are never
 * followed: an archive unpacked from a computer can hold a symlink
 * (`x -> /app/.env`), which would otherwise be read from the app's own
 * disk once it lands here.
 */
export default function* walkRegularFiles({ dir }: Params): Generator<string> {
    for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        const stats = lstatSync(full);

        if (stats.isDirectory()) yield* walkRegularFiles({ dir: full });
        else if (stats.isFile()) yield full;
    }
}
