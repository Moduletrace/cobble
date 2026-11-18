import { HostDirectorySlugMaxChars } from "@/src/dict/host-directory-dict";
import hostDirectorySlug from "./host-directory-slug";

type Params = {
    name: string;
    /**
     * The folder names already used, each a host directory's `slug`.
     */
    taken: string[];
};

/**
 * A host directory's folder name that no other one uses: its own, or the
 * same with a number after it (`notes`, `notes-2`, ...). Two directories
 * can't share a name in a computer, since both would mount at the same
 * place.
 */
export default function makeHostDirectorySlug({ name, taken }: Params) {
    const base = hostDirectorySlug({ name });
    let candidate = base;

    for (let number = 2; taken.includes(candidate); number++) {
        const suffix = `-${number}`;
        candidate = `${base.slice(0, HostDirectorySlugMaxChars - suffix.length).replace(/-+$/g, "")}${suffix}`;

        if (number > 999) return `${base.slice(0, 16)}-${Date.now().toString(36)}`;
    }

    return candidate;
}