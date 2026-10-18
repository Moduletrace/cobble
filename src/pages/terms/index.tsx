import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import TermsSection from "./(sections)/terms-section";
import InnerPageHeroSection from "@/src/components/general/inner-page-hero-section";
import { SiteData } from "@/src/data/site-data";

export default function TermsPage() {
    return (
        <>
            <InnerPageHeroSection
                title="Terms and Conditions"
                sub_title="Legal"
            />

            <TermsSection />
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `Terms and Conditions | ${SiteData["SiteName"]}`,
    description: `Read our terms and conditions for using the ${SiteData["SiteName"]} website.`,
};
