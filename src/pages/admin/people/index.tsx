import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import PeopleListSection from "./(sections)/people-list-section";
import { SiteData } from "@/src/data/site-data";

export default function AdminUsersPage() {
    return (
        <>
            <Hero />
            <PeopleListSection />
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `Admin People | ${SiteData["SiteName"]}`,
    description: "Manage admin users in the dashboard.",
};
