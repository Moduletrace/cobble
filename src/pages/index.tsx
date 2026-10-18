import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import Hero from "./(sections)/hero";
import FeaturesSection from "./(sections)/features-section";
import CTASection from "./(sections)/cta-section";
import { SiteData } from "@/src/data/site-data";

export default function Home() {
    return (
        <>
            <Hero />
            <FeaturesSection />
            <CTASection />
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `${SiteData["SiteName"]} | Modern SaaS Starter Preset`,
    description:
        "A modern, minimalist SaaS starter preset for Bun, Bunext, and SQLite.",
};
