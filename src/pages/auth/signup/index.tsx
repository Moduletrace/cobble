import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import SignupFormSection from "./(sections)/signup-form-section";
import { SiteData } from "@/src/data/site-data";

export default function SignupPage() {
    return <SignupFormSection />;
}

export const meta: BunextPageModuleMeta = {
    title: `Set Up | ${SiteData["SiteName"]}`,
    description: `Create the super admin for this ${SiteData["SiteName"]} install.`,
};
