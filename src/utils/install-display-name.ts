import { SiteData } from "@/src/data/site-data";

type Params = {
    install_name?: string | null;
};

/**
 * What the installed app is called: the install's own name, else
 * `SiteName`.
 */
export default function installDisplayName({ install_name }: Params) {
    return install_name?.trim() || SiteData["SiteName"];
}
