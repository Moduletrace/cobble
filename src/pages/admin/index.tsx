import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import DashboardHero from "./(sections)/dashboard-hero";
import DashboardShortcutsSection from "./(sections)/dashboard-shortcuts-section";

export default function AdminDashboardPage() {
    return (
        <>
            <DashboardHero />
            <DashboardShortcutsSection />
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `Admin Dashboard | ${SiteData["SiteName"]}`,
    description: `Admin dashboard for managing the ${SiteData["SiteName"]} website.`,
};
