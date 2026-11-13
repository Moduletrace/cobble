import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import { findGeneralSettingsSection } from "@/src/dict/general-settings-dict";
import { canEditGeneralSettingsSection } from "@/src/utils/rbac/general-settings-access";
import GeneralSettingsSectionComponents from "../(data)/general-settings-section-components";
import SettingsReadOnlyValues from "../(partials)/settings-read-only-values";
import SettingsShell from "../../(partials)/settings-shell";
import settingsSectionPageMeta from "../../(functions)/settings-section-page-meta";

/**
 * One group of General settings on its own page. Whoever may change it
 * gets the same form the General page shows; everyone else reads its
 * values, since a member sent here by a bot still needs to see the limit
 * that stopped it (and who can raise it).
 */
export default function AdminSettingsGeneralSectionPage() {
    const { pageProps } = useContext(AppContext);
    const section = pageProps?.general_section;
    const definition = findGeneralSettingsSection({ key: section?.key || "" });

    if (!section || !definition) return null;

    const Section = GeneralSettingsSectionComponents[section.key];
    const can_edit = canEditGeneralSettingsSection({ section: definition, user_types: pageProps?.user_types });

    if (can_edit && Section) {
        return (
            <SettingsShell title={section.title}>
                <Section />
            </SettingsShell>
        );
    }

    return (
        <SettingsShell title={section.title} description={definition.description}>
            <SettingsReadOnlyValues section={section} />
        </SettingsShell>
    );
}

export const meta = settingsSectionPageMeta();