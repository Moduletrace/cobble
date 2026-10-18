import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import ContactSection from "./(sections)/contact-section";
import { SiteData } from "@/src/data/site-data";

export default function ContactPage() {
    return <ContactSection />;
}

export const meta: BunextPageModuleMeta = {
    title: `Contact Us | ${SiteData["SiteName"]}`,
    description: `Get in touch with ${SiteData["SiteName"]}. We'd love to hear from you.`,
};
