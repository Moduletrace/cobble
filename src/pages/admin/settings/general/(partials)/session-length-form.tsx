import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import type { SessionLengthOverview } from "@/src/types";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    length?: SessionLengthOverview | null;
};

/**
 * How many messages a session takes, saved on its own without a reload.
 * Zero puts the code's default back.
 */
export default function SessionLengthForm({ length }: Props) {
    const [overview, setOverview] = useState(length || undefined);
    const [dirty, setDirty] = useState(false);
    const [max_messages, setMaxMessages] = useState(String(length?.max_messages ?? ""));
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
        if (!window.confirm("Save how many messages a session takes? Sessions already past it move on at the user's next message.")) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<SessionLengthOverview>>(
            "/api/admin/settings/session-length",
            {
                method: "POST",
                body: { max_messages: Number(max_messages) || 0 },
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
        setMaxMessages(String(res.singleRes.max_messages));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: sessions move on after ${res.singleRes.max_messages} messages.`,
        });
    };

    const discard = () => {
        setMaxMessages(String(overview?.max_messages ?? ""));
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
                key={`messages-${form_key}`}
                label="Start a new session after"
                type="number"
                min={0}
                max={overview?.max}
                step={1}
                numberText
                rawNumber
                defaultValue={max_messages}
                onChange={(event) => {
                    setMaxMessages(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                suffix={`messages`}
                info={`Counts the user's and the bot's messages. Fewer means cheaper replies but less said word for word; the summary carries the rest. 0 uses the default (${overview?.default_messages ?? ""}).`}
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
