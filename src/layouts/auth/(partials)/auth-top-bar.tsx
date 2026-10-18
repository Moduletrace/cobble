import Row from "@moduletrace/twui/layout/Row";
import Logo from "@/src/components/general/logo";
import ColorSchemeSelector from "@moduletrace/twui/elements/ColorSchemeSelector";

export default function AuthTopBar() {
    return (
        <Row className="w-full justify-between flex-nowrap px-4 sm:px-10 py-5">
            <Logo icon_size={32} />
            <ColorSchemeSelector
                className="text-slate-500 hover:text-foreground-light dark:text-slate-400 dark:hover:text-foreground-dark transition-colors"
                size="small"
            />
        </Row>
    );
}
