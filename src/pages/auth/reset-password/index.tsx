import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import RequestResetSection from "./(sections)/request-reset-section";
import { SiteData } from "@/src/data/site-data";

export default function ResetPasswordPage() {
    return <RequestResetSection />;
}

export const meta: BunextPageModuleMeta = {
    title: `Reset Password | ${SiteData["SiteName"]}`,
    description: `Reset your ${SiteData["SiteName"]} password.`,
};
