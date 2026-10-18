import { SiteData } from "@/src/data/site-data";

/**
 * Global company letterhead defaults.
 * These prefill sender blocks on new letter/email templates
 * and appear in the branded footer of generated PDFs.
 * Per-template fields override these.
 *
 * TODO: Replace the placeholder contact details below with the
 * official company registered address, phone and RC number.
 */
export const CompanyLetterheadDefaults = {
    name: SiteData["SiteName"],
    address_lines: [
        "Your Company Limited",
        "No. 1 Example Street, Example City",
    ],
    phone: "+000 000 000 0000",
    email: "support@example.com",
    website: SiteData["SiteURL"],
    rc_number: "",
    bank_name: "",
    ngn_acc_number: "",
} as const;

export type CompanyLetterhead = {
    name?: string;
    address_lines?: readonly string[];
    phone?: string;
    email?: string;
    website?: string;
    rc_number?: string;
    bank_name?: string;
    ngn_acc_number?: string;
};
