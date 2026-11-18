import { HostDirectorySlugMaxChars } from "@/src/dict/host-directory-dict";

type Params = {
    /**
     * What the user called the host directory.
     */
    name: string;
};

/**
 * The folder name a host directory is mounted under: its name, lowercased,
 * with accents taken off and anything that isn't a letter or a digit
 * turned into one dash. Never empty (`folder`), so a name in a script this
 * app can't read still mounts somewhere.
 */
export default function hostDirectorySlug({ name }: Params) {
    const slug = String(name ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, HostDirectorySlugMaxChars)
        .replace(/-+$/g, "");

    return slug || "folder";
}