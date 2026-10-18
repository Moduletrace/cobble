import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { SiteData } from "@/src/data/site-data";
import { AuthLegalLinks } from "../(data)/auth-legal-links";
import AuthLegalLink from "./auth-legal-link";

export default function AuthBottomBar() {
    return (
        <Row className="w-full justify-center flex-wrap gap-x-6! gap-y-2! px-4 py-6">
            <Span className="text-xs text-slate-400 dark:text-slate-500">
                &copy; {new Date().getFullYear()} {SiteData["SiteName"]}
            </Span>
            {AuthLegalLinks.map((link) => (
                <AuthLegalLink key={link.url} {...link} />
            ))}
        </Row>
    );
}
