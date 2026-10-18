import { AdminSections } from "@/src/dict/admin-sections-dict";

type Params = {
    pathname: string;
};

/**
 * Whether `pathname` is one of the live `AdminSections` or a page under one.
 */
export default function isAdminSectionPath({ pathname }: Params) {
    return AdminSections.some(
        (section) => pathname == section || pathname.startsWith(`${section}/`),
    );
}
