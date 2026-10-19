import { useContext, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { CpuAi } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage, HarnessOverview } from "@/src/types";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import BotHarnessForm from "@/src/pages/admin/settings/(partials)/bot-harness-form";
import HeaderIconButton from "@/src/components/general/header-icon-button";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The workspace the conversation is in: the modal edits its models.
     */
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    harnesses?: HarnessOverview[] | null;
    onSaved: (harnesses: HarnessOverview[]) => void;
};

/**
 * The header's model icon: opens every model the bot uses (text, media
 * reading, transcription, speech, images) in the Models settings form. On
 * the coordinator that form is the defaults, for super admins only; a
 * worker's (or a workspace's) models are for super admins and admins.
 * Everyone else gets the icon disabled, its title saying why.
 */
export default function BotModelsModal({ bot, workspace, harnesses, onSaved }: Props) {
    const { pageProps } = useContext(AppContext);
    const [open, setOpen] = useState(false);

    if (!harnesses?.length || !bot.id) return null;

    const in_workspace = Boolean(workspace?.id);
    const is_coordinator = bot.kind == "coordinator" && !in_workspace;
    const can_edit = is_coordinator
        ? isPassThroughUser({ user_types: pageProps?.user_types })
        : canManageCrew({ user_types: pageProps?.user_types });
    const name = bot.name || "This bot";

    const target = (
        <HeaderIconButton
            icon={CpuAi}
            title={
                can_edit
                    ? in_workspace
                        ? `Change ${workspace?.name || "the workspace"}'s models`
                        : is_coordinator
                        ? "Change the default models"
                        : `Change ${name}'s models`
                    : is_coordinator
                    ? `${name} uses the default models. A super admin can change them in Settings, under Models.`
                    : `An admin can change the models ${name} uses.`
            }
            disabled={!can_edit}
        />
    );

    if (!can_edit) return target;

    return (
        <Modal
            target={target}
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-3xl bg-paper px-6 pt-6 pb-0"
        >
            <Stack className="w-full gap-1! items-stretch pb-2">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    {in_workspace
                        ? `Models in ${workspace?.name || "this workspace"}`
                        : is_coordinator
                          ? "Default models"
                          : `${name}'s models`}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {in_workspace
                        ? `Every bot working in ${workspace?.name || "this workspace"} uses these, the coordinator too. Left on "Same as the default", ${name} uses its own models, else the defaults.`
                        : is_coordinator
                        ? `${name} and every bot left on the default use these. The text model chats, plans and drives computers; the others read media, transcribe, speak and make images for it. Providers are in Settings, under Models.`
                        : `${name} uses the default models unless you pick its own. The text model chats, plans and drives computers; the others read media, transcribe, speak and make images for it.`}
                </Span>
            </Stack>
            <BotHarnessForm
                bot={bot}
                workspace_id={workspace?.id || null}
                harnesses={harnesses}
                onSaved={onSaved}
            />
        </Modal>
    );
}
