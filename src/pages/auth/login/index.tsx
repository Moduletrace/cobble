import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import LoginFormSection from "./(sections)/login-form-section";
import { SiteData } from "@/src/data/site-data";

export default function LoginPage() {
    return <LoginFormSection />;
}

export const meta: BunextPageModuleMeta = {
    title: `Log In | ${SiteData["SiteName"]}`,
    description: `Log in to your ${SiteData["SiteName"]} account.`,
};
