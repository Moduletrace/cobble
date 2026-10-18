import { CompanyLetterheadDefaults } from "@/src/dict/company-dict";
import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";

export type ContactChannel = {
    Icon: LucideIcon;
    label: string;
    value: string;
    href?: string;
};

export const ContactChannels: ContactChannel[] = [
    {
        Icon: Mail,
        label: "Email",
        value: CompanyLetterheadDefaults["email"],
        href: `mailto:${CompanyLetterheadDefaults["email"]}`,
    },
    {
        Icon: Phone,
        label: "Phone",
        value: CompanyLetterheadDefaults["phone"],
        href: `tel:${CompanyLetterheadDefaults["phone"].replace(/\s/g, "")}`,
    },
    {
        Icon: MapPin,
        label: "Office",
        value: CompanyLetterheadDefaults["address_lines"].join(", "),
    },
];
