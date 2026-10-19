import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import type { HarnessOverviewPayload, PublicHarnessProvider } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsStatus from "../../(partials)/settings-status";
import ProviderForm from "./provider-form";
import ProviderRow from "./provider-row";

type Props = {
    providers: PublicHarnessProvider[];
    onChanged: (overview: HarnessOverviewPayload) => void;
};

/**
 * Where models come from. Each change saves right away and refreshes the
 * whole page's data.
 */
export default function ProvidersGroup({ providers, onChanged }: Props) {
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<{ error?: boolean; success?: boolean; msg?: string }>();

    const changed = (overview: HarnessOverviewPayload, msg: string) => {
        setStatus({ success: true, msg });
        onChanged(overview);
    };

    return (
        <SettingsGroup
            title="Providers"
            description="Where models come from. Keys are encrypted and never shown again. Model lists refresh every hour."
        >
            <Stack className="w-full gap-0! items-stretch">
                {providers.map((provider) => (
                    <ProviderRow
                        key={provider.id}
                        provider={provider}
                        onChanged={changed}
                        onError={(msg) => setStatus({ error: true, msg })}
                    />
                ))}
            </Stack>
            {adding ? (
                <ProviderForm
                    onSaved={(overview, msg) => {
                        setAdding(false);
                        changed(overview, msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : (
                <Row className="gap-3! items-center justify-between">
                    <SettingsStatus status={status} />
                    <Button
                        title="Add a provider"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        className="ml-auto"
                        onClick={() => {
                            setStatus(undefined);
                            setAdding(true);
                        }}
                    >
                        <Plus size={16} aria-hidden />
                        Add a provider
                    </Button>
                </Row>
            )}
        </SettingsGroup>
    );
}
