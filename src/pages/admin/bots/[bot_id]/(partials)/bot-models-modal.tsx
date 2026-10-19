import { useContext, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ChevronDown, CpuAi } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { BotWithLastMessage, HarnessOverview } from "@/src/types";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import BotHarnessForm from "./bot-harness-form";

type Props = {
    bot: BotWithLastMessage;
    harnesses?: HarnessOverview[] | null;
};

/**
 * The header's model button: shows the model the bot thinks with and
 * opens every model it uses (text, media reading, transcription, speech,
 * images) in the Models settings form. On the coordinator that form is the
 * defaults, for super admins only; everyone else gets the button read only.
 */
export default function BotModelsModal({ bot, harnesses: initial }: Props) {
    const { pageProps } = useContext(AppContext);
    const [harnesses, setHarnesses] = useState(initial);
    const [open, setOpen] = useState(false);

    if (!harnesses?.length || !bot.id) return null;

    const is_coordinator = bot.kind == "coordinator";
    const can_edit =
        !is_coordinator ||
        isPassThroughUser({ user_types: pageProps?.user_types });
    const name = bot.name || "This bot";
    const current =
        harnesses.find((h) => h.harness == "text")?.current?.name ||
        "No model set up";

    const target = (
        <Button
            title={
                can_edit
                    ? `${name}'s models`
                    : `${name} uses the default models. A super admin can change them here or in Settings, under Models.`
            }
            type="button"
            variant="outlined"
            color="gray"
            size="small"
            disabled={!can_edit}
            buttonContentProps={{ className: "min-w-0" }}
            className="max-w-full min-w-0 gap-2! flex-nowrap text-[13px] text-ink-secondary hover:text-ink"
        >
            <CpuAi size={16} aria-hidden className="shrink-0 -mt-0.5" />
            <Span className="truncate">{current}</Span>
            {can_edit ? (
                <ChevronDown size={14} aria-hidden className="shrink-0" />
            ) : null}
        </Button>
    );

    if (!can_edit) {
        return (
            <Stack className="max-w-[280px] min-w-0 shrink">
                {target}
            </Stack>
        );
    }

    return (
        <Modal
            target={target}
            targetWrapperProps={{
                className: "max-w-[280px] min-w-0 shrink",
            }}
            open={open}
            setOpen={setOpen}
            className="max-w-3xl bg-paper px-6 pt-6 pb-0"
        >
            <Stack className="w-full gap-1! items-stretch pb-2">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    {is_coordinator ? "Default models" : `${name}'s models`}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {is_coordinator
                        ? `${name} and every bot left on the default use these. Providers are in Settings, under Models.`
                        : `${name} uses the default models unless you pick its own.`}
                </Span>
            </Stack>
            <BotHarnessForm
                bot={bot}
                harnesses={harnesses}
                onSaved={setHarnesses}
            />
        </Modal>
    );
}
