import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import AboutPresetSection from "./(sections)/about-preset-section";
import InnerPageHeroSection from "@/src/components/general/inner-page-hero-section";
import CTASection from "../(sections)/cta-section";
import { SiteData } from "@/src/data/site-data";

export default function AboutPage() {
    return (
        <>
            <InnerPageHeroSection
                title="A modern starting point for full-stack apps"
                sub_title="About"
                description="Bun, Bunext, SQLite, Tailwind v4, and the twui design system, pre-wired and ready to customize."
            />

            <AboutPresetSection />

            <CTASection />
        </>
    );
}

export const meta: BunextPageModuleMeta = {
    title: `About | ${SiteData["SiteName"]}`,
    description:
        "Learn about the Bun + SQLite SaaS starter preset and the stack it ships with.",
};