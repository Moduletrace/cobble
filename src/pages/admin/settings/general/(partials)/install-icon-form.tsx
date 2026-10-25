import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import ImagePickField from "@/src/components/general/image-pick-field";
import {
    PwaDefaultInstallIcon,
    PwaInstallIconMinSide,
    type PwaInstallIcon,
} from "@/src/data/pwa-data";
import { BotHues, type BotHue } from "@/src/dict/bot-dict";
import type { SaveInstallIconRequest } from "@/src/schemas/install-schema";
import installIconBase from "@/src/utils/install-icon-base";
import SettingsSaveBar from "../../(partials)/settings-save-bar";
import { InstallIconModes } from "../(data)/install-icon-modes";
import InstallIconModeOption from "./install-icon-mode-option";
import InstallIconPreview from "./install-icon-preview";
import InstallIconShape from "./install-icon-shape";
import InstallIconStoneOption from "./install-icon-stone-option";

type Props = {
    install_icon?: PwaInstallIcon | null;
};

/**
 * The app icon: a stone, or an uploaded image with the picked stone in its
 * top-left corner. Previewed as launchers crop it, saved on its own
 * without a reload.
 */
export default function InstallIconForm({ install_icon }: Props) {
    const [saved, setSaved] = useState(install_icon || PwaDefaultInstallIcon);
    const [mode, setMode] = useState(saved.mode);
    const [stone, setStone] = useState<BotHue>(saved.stone);
    const [mark, setMark] = useState(saved.mark);
    /**
     * A newly picked image, sent with the next save.
     */
    const [data_url, setDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const saved_base = installIconBase({ icon: saved });
    const image_src =
        data_url || (saved.mode == "image" && saved_base ? `${saved_base}/plain-512.png` : null);
    const dirty =
        Boolean(data_url) || mode != saved.mode || stone != saved.stone || mark != saved.mark;

    const change = () => setStatus(undefined);

    const save = async () => {
        if (mode == "image" && !image_src) {
            setStatus({ error: true, msg: `Upload an image first.` });
            return;
        }

        const question =
            mode == "stone" && saved.mode == "image"
                ? "Switch the app icon to a stone? The uploaded image is removed."
                : "Save the app icon?";

        if (!window.confirm(question)) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<SaveInstallIconRequest, APIResponseObject<PwaInstallIcon>>(
            "/api/admin/settings/install-icon",
            { method: "POST", body: { mode, stone, mark, data_url } },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({ error: true, msg: res?.msg || `Couldn't save the icon.` });
            return;
        }

        setSaved(res.singleRes);
        setMode(res.singleRes.mode);
        setStone(res.singleRes.stone);
        setMark(res.singleRes.mark);
        setDataUrl(null);
        setStatus({
            success: true,
            msg: `Saved. Reinstall the app on a device to see the new icon.`,
        });
    };

    const discard = () => {
        setMode(saved.mode);
        setStone(saved.stone);
        setMark(saved.mark);
        setDataUrl(null);
        setStatus(undefined);
    };

    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault();
                save().catch(() => {});
            }}
            className="w-full gap-4! items-stretch"
        >
            <Row
                role="radiogroup"
                aria-label="Icon"
                className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3!"
            >
                {InstallIconModes.map((option) => (
                    <InstallIconModeOption
                        key={option.value}
                        {...option}
                        selected={mode == option.value}
                        onSelect={() => {
                            setMode(option.value);
                            change();
                        }}
                    />
                ))}
            </Row>
            {mode == "image" ? (
                <ImagePickField
                    preview={
                        <InstallIconShape
                            shape="rounded"
                            mode="image"
                            stone={stone}
                            mark={false}
                            image_src={image_src}
                            className="size-16"
                        />
                    }
                    has_image={Boolean(image_src)}
                    onPick={({ data_url }) => {
                        setDataUrl(data_url);
                        change();
                    }}
                    onRemove={() => {
                        setDataUrl(null);
                        setMode("stone");
                        change();
                    }}
                    loading={loading}
                    note={`PNG, JPG or WebP, at least ${PwaInstallIconMinSide} pixels on each side. It's cropped to a square from the centre.`}
                />
            ) : null}
            <Stack className="w-full gap-2! items-start">
                <Span className="text-sm font-bold leading-5 text-ink">
                    {mode == "image" ? "Corner stone" : "Stone"}
                </Span>
                <Row role="radiogroup" aria-label="Stone" className="gap-2!">
                    {BotHues.map((hue) => (
                        <InstallIconStoneOption
                            key={hue.value}
                            {...hue}
                            selected={stone == hue.value}
                            onSelect={() => {
                                setStone(hue.value);
                                change();
                            }}
                        />
                    ))}
                </Row>
            </Stack>
            {mode == "image" ? (
                <Checkbox
                    title="Show the stone in the top-left corner"
                    label="Show the stone in the top-left corner"
                    checked={mark}
                    changeHandler={(checked: boolean) => {
                        setMark(checked);
                        change();
                    }}
                />
            ) : null}
            <InstallIconPreview mode={mode} stone={stone} mark={mark} image_src={image_src} />
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save icon"
                onDiscard={discard}
            />
        </Form>
    );
}
