import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import SSOFormSection from "./(sections)/sso-form-section";
import { SiteData } from "@/src/data/site-data";

export default function SSOPage() {
    return <SSOFormSection />;
}

export const meta: BunextPageModuleMeta = {
    title: `Enter Login Code | ${SiteData["SiteName"]}`,
    description: `Enter your one-time login code to log in to ${SiteData["SiteName"]}.`,
};
