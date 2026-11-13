import { Settings2 } from "lucide-react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import generalSettingsHref, { findGeneralSettingsField, findGeneralSettingsSection } from "@/src/dict/general-settings-dict";

type Props = {
    section: string;
    /**
     * The field within the group, when the ref names one.
     */
    field?: string | null;
};

/**
 * A setting a bot named in a message (`settingRef`): a pill linking to that
 * group's own page under Settings > General, with the field's anchor when
 * it names one. The bot says the value in its text; the pill takes the
 * reader to the input that changes it.
 */
export default function SettingRefChip({ section, field }: Props) {
    const known = findGeneralSettingsSection({ key: section });
    const known_field = findGeneralSettingsField({ section, field });

    if (!known) {
        return <Span className="font-bold">{`setting ${section}${field ? ` ${field}` : ""}`}</Span>;
    }

    const label = known_field ? `${known.title} · ${known_field.title}` : known.title;

    return (
        <Link
            href={generalSettingsHref({ section: known.key, field: known_field?.key })}
            title={`Open ${label} in Settings`}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap hover:opacity-80"
        >
            <Settings2 size={13} aria-hidden className="shrink-0" />
            <Span className="min-w-0 truncate">{label}</Span>
        </Link>
    );
}