import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { GeneralSettingsSectionValues } from "@/src/dict/general-settings-dict";
import SettingsList from "../../(partials)/settings-list";
import SettingsValueRow from "./settings-value-row";

type Props = {
    section: GeneralSettingsSectionValues;
};

/**
 * A group of General settings for someone who may read it but not change
 * it: a member sent to a limit they hit, since knowing the value is what
 * lets them ask the right person to raise it.
 */
export default function SettingsReadOnlyValues({ section }: Props) {
    return (
        <Stack className="w-full gap-3! items-stretch">
            {section.values.length ? (
                <SettingsList>
                    {section.values.map((value) => (
                        <SettingsValueRow key={value.key} title={value.title} label={value.label} />
                    ))}
                </SettingsList>
            ) : null}
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {`Only ${section.editor} can change ${section.values.length == 1 ? "it" : "these"} here.`}
            </Span>
        </Stack>
    );
}