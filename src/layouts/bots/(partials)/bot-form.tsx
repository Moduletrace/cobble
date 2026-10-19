import { useContext, useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Textarea from "@moduletrace/twui/form/Textarea";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import ImagePickField from "@/src/components/general/image-pick-field";
import { AppContext } from "@/src/pages/__root";
import { BotHues, type BotHue } from "@/src/dict/bot-dict";
import setProfileImage from "@/src/functions/frontend/set-profile-image";
import postAdminApi from "../(functions)/post-admin-api";
import usePickedImage from "../(hooks)/use-picked-image";
import pickFreeHue from "../(utils)/pick-free-hue";
import AddFormActions from "./add-form-actions";
import BotFormPreview from "./bot-form-preview";

type Props = {
    /**
     * Edits this bot; adds a worker when not given.
     */
    bot?: BUN_SQLITE_COBBLE_BOTS;
    onCancel: () => void;
};

/**
 * Adds or edits a bot: its picture, name, job, colour and instructions,
 * with a live preview of how it'll look. A new bot on a workspace's pages
 * joins that workspace too (unless unticked), then its conversation opens.
 * The coordinator keeps its name and has no colour: only its picture and
 * instructions change.
 */
export default function BotForm({ bot, onCancel }: Props) {
    const { pageProps } = useContext(AppContext);
    const workspace = pageProps?.workspace;
    const crew = pageProps?.all_bots || pageProps?.bots || [];
    const is_coordinator = bot?.kind == "coordinator";

    const [name, setName] = useState(bot?.name || "");
    const [role, setRole] = useState(bot?.role || "");
    const [hue, setHue] = useState<BotHue>(
        () => (bot?.hue as BotHue) || pickFreeHue({ taken: crew.map((b) => b.hue) }),
    );
    const [system_prompt, setSystemPrompt] = useState(bot?.system_prompt || "");
    const [join, setJoin] = useState(!bot && Boolean(workspace?.id));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const image = usePickedImage({ image_media_id: bot?.image_media_id });

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(bot?.id ? `Save changes to ${bot.name || "this bot"}?` : `Add ${name || "this bot"} to your crew?`)) return;

        setLoading(true);
        setError(undefined);

        const workspace_id = join && workspace?.id ? workspace.id : null;
        const res = bot?.id
            ? await postAdminApi<BUN_SQLITE_COBBLE_BOTS>({
                  path: "bots/update-bot",
                  body: { bot_id: bot.id, name: name || bot.name, role, hue, system_prompt },
              })
            : await postAdminApi<{ bot_id: number }>({
                  path: "bots/create-bot",
                  body: { name, role, hue, system_prompt, workspace_id },
              });
        const bot_id = bot?.id || (res.singleRes as { bot_id?: number } | undefined)?.bot_id;

        if (!res.success || !bot_id) {
            setLoading(false);
            setError(res.msg || "Couldn't save the bot.");
            return;
        }

        if (image.changed) {
            const image_res = await setProfileImage({
                target: "bot",
                id: bot_id,
                data_url: image.data_url || null,
            }).catch(() => null);

            if (!image_res?.success) {
                setLoading(false);
                setError(image_res?.msg || "The bot is saved, but its picture isn't. Try another image.");
                return;
            }
        }

        if (bot?.id) {
            window.location.reload();
            return;
        }

        window.location.href = workspace_id
            ? `/admin/workspaces/${workspace_id}/bots/${bot_id}`
            : `/admin/bots/${bot_id}`;
    };

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
            <ImagePickField
                preview={
                    <BotFormPreview
                        name={name}
                        role={role}
                        hue={is_coordinator ? null : hue}
                        image_media_id={image.image_media_id}
                        picked_src={image.data_url}
                    />
                }
                has_image={image.has_image}
                onPick={image.pick}
                onRemove={image.remove}
                disabled={loading}
                note="Optional. Without one, it's a stone in its colour."
            />
            {is_coordinator ? null : (
                <>
                    <Input
                        id="bot-form-name"
                        title="Name"
                        label="Name"
                        showLabel
                        placeholder="Scout"
                        autoComplete="off"
                        defaultValue={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        id="bot-form-role"
                        title="Job"
                        label="Job"
                        showLabel
                        placeholder="Finds and summarises research"
                        autoComplete="off"
                        defaultValue={role}
                        info="One line, shown under its name."
                        onChange={(e) => setRole(e.target.value)}
                    />
                    <Select
                        id="bot-form-hue"
                        title="Colour"
                        label="Colour"
                        showLabel
                        options={BotHues.map((option) => ({
                            value: option.value,
                            title: option.title,
                            default: option.value == hue,
                        }))}
                        info="Its colour for life: how you tell it apart, even with a picture."
                        changeHandler={(next) => setHue(next as BotHue)}
                    />
                </>
            )}
            <Textarea
                id="bot-form-instructions"
                title="Instructions"
                label="Instructions"
                showLabel
                rows={6}
                placeholder="You research topics for the user. Find good sources, read them, and report back with a short summary and links."
                defaultValue={system_prompt}
                info="What it does and how. It refines these itself as it learns how you work."
                onChange={(e) => setSystemPrompt(e.target.value)}
            />
            {!bot && workspace?.id ? (
                <Checkbox
                    title={`Put it in ${workspace.name}`}
                    label={`Put it in ${workspace.name || "this workspace"}`}
                    checked={join}
                    changeHandler={setJoin}
                />
            ) : null}
            <AddFormActions
                submit_label={bot ? "Save" : "Add bot"}
                loading={loading}
                error={error}
                onCancel={onCancel}
            />
        </Form>
    );
}
