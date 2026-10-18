import Divider from "@moduletrace/twui/layout/Divider";
import { SettingsPages } from "@/src/dict/settings-pages-dict";
import RailBackLink from "./rail-back-link";
import RailSettingsLink from "./rail-settings-link";

type Props = {
    pathname?: string;
};

/**
 * Settings mode of the rail: back to the bots, then the settings sub pages.
 */
export default function RailSettingsList({ pathname }: Props) {
    const current = pathname?.replace(/\/$/, "");

    return (
        <>
            <RailBackLink />
            <Divider className="shrink-0 mx-1 lg:mx-3 my-2 w-auto border-hairline dark:border-hairline" />
            {SettingsPages.map((page) => (
                <RailSettingsLink
                    key={page.url}
                    {...page}
                    selected={
                        current == page.url ||
                        Boolean(current?.startsWith(`${page.url}/`))
                    }
                />
            ))}
        </>
    );
}
