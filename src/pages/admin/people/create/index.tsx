import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import UserFormSection from "./(sections)/user-form-section";
import { SiteData } from "@/src/data/site-data";

export default function AdminUsersCreatePage() {
    return (
        <>
            <Hero />
            <UserFormSection />
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `Create Admin User | ${SiteData["SiteName"]}`,
    description: "Create a new admin user in the dashboard.",
};
