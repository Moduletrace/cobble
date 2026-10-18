import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import ColorSchemeSelector from "@moduletrace/twui/elements/ColorSchemeSelector";
import { SiteData } from "@/src/data/site-data";

export default function Footer() {
    /**
     * Render component
     */
    return (
        <footer className="w-full px-5 xl:px-10 py-5 border-t border-slate-200 dark:border-white/10">
            <Row className="w-full justify-between">
                <Span className="text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} {SiteData["SiteName"]}
                </Span>
                <Row className="items-center gap-4!">
                    <Span className="text-xs text-slate-400">
                        Admin console
                    </Span>
                    <ColorSchemeSelector
                        className="text-slate-400 hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
                        size="small"
                    />
                </Row>
            </Row>
        </footer>
    );
}
