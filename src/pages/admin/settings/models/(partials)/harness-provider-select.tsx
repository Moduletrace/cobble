import Select from "@moduletrace/twui/form/Select";
import type { HarnessProviderChoice } from "@/src/types";

export const InheritProviderValue = "inherit";
export const AnyProviderValue = "any";

type Props = {
    id: string;
    providers: HarnessProviderChoice[];
    provider_id: number | null;
    /**
     * On a bot's page: offer the default, titled this.
     */
    inherit_title?: string;
    inherit?: boolean;
    onChange: (value: { provider_id: number | null; inherit: boolean }) => void;
};

/**
 * Where a harness gets its models: any provider, or one of them. On a
 * bot's page it can also use the default setting instead.
 */
export default function HarnessProviderSelect({
    id,
    providers,
    provider_id,
    inherit_title,
    inherit,
    onChange,
}: Props) {
    const value = inherit
        ? InheritProviderValue
        : provider_id
          ? String(provider_id)
          : AnyProviderValue;

    return (
        <Select
            id={id}
            title="Provider"
            label="Provider"
            showLabel
            value={value}
            options={[
                ...(inherit_title ? [{ value: InheritProviderValue, title: inherit_title }] : []),
                { value: AnyProviderValue, title: "Any provider" },
                ...providers.map((provider) => ({
                    value: String(provider.id),
                    title: provider.name,
                })),
            ]}
            changeHandler={(picked) =>
                onChange({
                    inherit: picked == InheritProviderValue,
                    provider_id:
                        picked == InheritProviderValue || picked == AnyProviderValue
                            ? null
                            : Number(picked),
                })
            }
        />
    );
}
