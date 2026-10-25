import { SiteData } from "@/src/data/site-data";

type Params = {
    manifest: Record<string, unknown>;
    install_name?: string | null;
};

/**
 * The generated manifest with the install's own name, so the launcher
 * tells two installs apart. `short_name` (the label under the icon) is the
 * name alone; `name` adds `SiteName` unless the name already says it.
 * Unnamed, the manifest is unchanged.
 */
export default function namePwaManifest({ manifest, install_name }: Params) {
    const name = install_name?.trim();

    if (!name) return manifest;

    const site_name = SiteData["SiteName"];
    const says_site_name = name.toLowerCase().includes(site_name.toLowerCase());

    return {
        ...manifest,
        name: says_site_name ? name : `${name} - ${site_name}`,
        short_name: name,
    };
}
