import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ArrowRight, CpuAi } from "lucide-react";
import { SettingsModelsPath, SettingsSetupPath } from "@/src/dict/settings-pages-dict";
import { AppContext } from "@/src/pages/__root";
import IconTile from "@/src/components/general/icon-tile";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";

type Props = {
    bot_name: string;
};

/**
 * Shown in the conversation while the bot has no text model to run on
 * (nothing would answer a message). A super admin is sent to connect a
 * provider, or to the guided setup; anyone else is told who can.
 */
export default function NoModelNotice({ bot_name }: Props) {
    const { pageProps } = useContext(AppContext);
    const can_set_up = isPassThroughUser({ user_types: pageProps?.user_types });

    return (
        <Stack
            role="status"
            className="w-full max-w-[440px] mx-auto gap-3! items-start rounded-default border border-solid border-hairline bg-surface px-5 py-4"
        >
            <Row className="gap-3! flex-nowrap items-center">
                <IconTile Icon={CpuAi} />
                <Span className="text-sm font-bold leading-5 text-ink">
                    {can_set_up ? "Connect a model provider" : "No model set up yet"}
                </Span>
            </Row>
            <Span className="text-[13px] leading-5 text-ink-secondary">
                {can_set_up
                    ? `${bot_name} has no model to think with, so nothing would answer yet. Add a provider key (OpenRouter has free models) and pick what your bots run on.`
                    : `${bot_name} has no model to think with, so nothing would answer yet. The super admin connects one in Settings.`}
            </Span>
            {can_set_up ? (
                <Row className="w-full gap-2! justify-end">
                    <Button
                        title="Open the guided setup"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        href={SettingsSetupPath}
                    >
                        Guided setup
                    </Button>
                    <Button
                        title="Connect a provider"
                        type="button"
                        size="small"
                        href={SettingsModelsPath}
                        afterIcon={<ArrowRight size={14} aria-hidden />}
                    >
                        Connect a provider
                    </Button>
                </Row>
            ) : null}
        </Stack>
    );
}
