import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import PrivacySection from "./(sections)/privacy-section";
import InnerPageHeroSection from "@/src/components/general/inner-page-hero-section";
import { SiteData } from "@/src/data/site-data";

export default function PrivacyPage() {
    return (
        <>
            <InnerPageHeroSection title="Privacy Policy" sub_title="Legal" />

            <PrivacySection />
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `Privacy Policy | ${SiteData["SiteName"]}`,
    description: "Read our privacy policy to understand how we collect, use, and protect your personal information.",
};
