import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import ConfirmResetSection from "./(sections)/confirm-reset-section";
import { SiteData } from "@/src/data/site-data";

export default function ConfirmResetPage() {
    return <ConfirmResetSection />;
}

export const meta: BunextPageModuleMeta = {
    title: `Set New Password | ${SiteData["SiteName"]}`,
    description: `Set a new password for your ${SiteData["SiteName"]} account.`,
};
