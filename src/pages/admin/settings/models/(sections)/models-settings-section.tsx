import HarnessSettingsForm from "../(partials)/harness-settings-form";
import ProvidersGroup from "../(partials)/providers-group";
import useModelsOverview from "../(hooks)/use-models-overview";

/**
 * Providers first (where models come from), then what each harness uses.
 * Both update from the fresh data every save returns.
 */
export default function ModelsSettingsSection() {
    const { overview, version, notice, update, saveSettings } = useModelsOverview();

    if (!overview) return null;

    return (
        <>
            <ProvidersGroup providers={overview.providers} onChanged={update} />
            <HarnessSettingsForm
                key={version}
                harnesses={overview.harnesses}
                notice={notice}
                save={saveSettings}
            />
        </>
    );
}
