import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import type { MessageLengthOverview } from "@/src/types";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    length?: MessageLengthOverview | null;
};

/**
 * The longest chat message a user may send, saved on its own without a
 * reload. Zero puts the code's default back.
 */
export default function MessageLengthForm({ length }: Props) {
    const [overview, setOverview] = useState(length || undefined);
    const [dirty, setDirty] = useState(false);
    const [max_chars, setMaxChars] = useState(String(length?.max_chars ?? ""));
    /**
     * The input only reads `defaultValue` when it mounts, so discarding or
     * saving remounts it with the saved number.
     */
    const [form_key, setFormKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const save = async () => {
        if (!window.confirm("Save how long a message users may send? Open conversations pick it up when they reload.")) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<MessageLengthOverview>>(
            "/api/admin/settings/message-length",
            {
                method: "POST",
                body: { max_chars: Number(max_chars) || 0 },
            },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({
                error: true,
                msg: res?.msg || `Couldn't save it.`,
            });
            return;
        }

        setOverview(res.singleRes);
        setMaxChars(String(res.singleRes.max_chars));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: messages can be up to ${res.singleRes.max_chars.toLocaleString("en")} characters.`,
        });
    };

    const discard = () => {
        setMaxChars(String(overview?.max_chars ?? ""));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus(undefined);
    };

    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault();
                save().catch(() => {});
            }}
            className="w-full gap-3! items-stretch"
        >
            <Input
                key={`chars-${form_key}`}
                label="Longest message"
                id="max_chars"
                className="scroll-mt-24"
                type="number"
                min={0}
                max={overview?.max}
                step={1}
                numberText
                rawNumber
                defaultValue={max_chars}
                onChange={(event) => {
                    setMaxChars(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                suffix={`characters`}
                info={`Counts the message as written, formatting and mentions included. At most ${overview?.max?.toLocaleString("en") ?? ""}. 0 uses the default (${overview?.default_chars?.toLocaleString("en") ?? ""}).`}
            />
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save"
                onDiscard={discard}
            />
        </Form>
    );
}
