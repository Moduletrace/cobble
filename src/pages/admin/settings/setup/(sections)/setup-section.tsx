import { useContext, useState } from "react";
import Span from "@moduletrace/twui/layout/Span";
import { SiteData } from "@/src/data/site-data";
import { AppContext } from "@/src/pages/__root";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import InstallNameForm from "../../general/(partials)/install-name-form";
import HarnessSettingsForm from "../../models/(partials)/harness-settings-form";
import ProvidersGroup from "../../models/(partials)/providers-group";
import useModelsOverview from "../../models/(hooks)/use-models-overview";
import { SetupSteps } from "../(data)/setup-steps";
import { SetupNextLinks } from "../(data)/setup-next-links";
import SetupLinkRow from "../(partials)/setup-link-row";
import SetupStepNav from "../(partials)/setup-step-nav";
import SetupStepsTrail from "../(partials)/setup-steps-trail";
import SetupTextModelStatus from "../(partials)/setup-text-model-status";

/**
 * The guided setup a new install opens on after the super admin signs
 * up, and that stays under Settings to come back to: name the app,
 * connect a provider, pick the models, then where to go next. Each step
 * saves on its own and any can be skipped; the provider and model steps
 * share their data, so a key added shows in the models at once.
 */
export default function SetupSection() {
    const { pageProps } = useContext(AppContext);
    const { overview, version, notice, update, saveSettings } = useModelsOverview();
    const [index, setIndex] = useState(0);

    if (!overview) return null;

    const step = SetupSteps[index]!.key;
    const text = overview.harnesses.find((harness) => harness.harness == "text");

    const go = (next: number) => {
        setIndex(Math.max(0, Math.min(SetupSteps.length - 1, next)));
    };

    return (
        <>
            <SetupStepsTrail index={index} onSelect={go} />
            {step == "welcome" ? (
                <>
                    <SettingsGroup title={`Welcome to ${SiteData["SiteName"]}`}>
                        <Span className="text-sm leading-6 text-ink">
                            {`A few steps get your crew working: connect where models come from, then pick what your bots think, see, hear and speak with. Every step saves on its own, and you can skip any of them. This setup stays under Settings to come back to.`}
                        </Span>
                    </SettingsGroup>
                    <SettingsGroup
                        title="App name"
                        description="The name this install goes by when it's added to a home screen or app list. Optional."
                    >
                        <InstallNameForm install_name={pageProps?.install_name} />
                    </SettingsGroup>
                </>
            ) : null}
            {step == "provider" ? (
                <>
                    <SettingsGroup
                        title="Connect a provider"
                        description="Your bots need at least one model provider. OpenRouter is already added: give it a key and its free models work right away."
                    >
                        <SetupTextModelStatus text={text} />
                    </SettingsGroup>
                    <ProvidersGroup providers={overview.providers} onChanged={update} />
                </>
            ) : null}
            {step == "models" ? (
                <>
                    <SettingsGroup
                        title="Pick models"
                        description="Text picks a free model by itself until you choose one. Transcription, Speech and Embeddings (knowledgebase search) need a model picked before they work."
                    >
                        <SetupTextModelStatus text={text} />
                    </SettingsGroup>
                    <HarnessSettingsForm
                        key={version}
                        harnesses={overview.harnesses}
                        notice={notice}
                        save={saveSettings}
                    />
                </>
            ) : null}
            {step == "ready" ? (
                <>
                    <SettingsGroup title="You're set">
                        <SetupTextModelStatus text={text} />
                    </SettingsGroup>
                    <SettingsGroup
                        title="Next"
                        description="Everything else is set up from its own page, whenever you need it."
                    >
                        <SettingsList>
                            {SetupNextLinks.map((link) => (
                                <SetupLinkRow key={link.href} {...link} />
                            ))}
                        </SettingsList>
                    </SettingsGroup>
                </>
            ) : null}
            <SetupStepNav
                is_first={index == 0}
                is_last={index == SetupSteps.length - 1}
                onBack={() => go(index - 1)}
                onNext={() => go(index + 1)}
            />
        </>
    );
}
