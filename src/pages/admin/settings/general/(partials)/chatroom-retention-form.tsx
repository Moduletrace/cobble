import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import type { ChatroomRetentionOverview } from "@/src/types";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    retention?: ChatroomRetentionOverview | null;
};

/**
 * How many days closed chatrooms are kept and how many rooms one place
 * keeps, saved together without a reload. Zero puts a default back.
 */
export default function ChatroomRetentionForm({ retention }: Props) {
    const [overview, setOverview] = useState(retention || undefined);
    const [dirty, setDirty] = useState(false);
    const [keep_days, setKeepDays] = useState(String(retention?.keep_days ?? ""));
    const [max_per_place, setMaxPerPlace] = useState(String(retention?.max_per_place ?? ""));
    /**
     * The inputs only read `defaultValue` when they mount, so discarding or
     * saving remounts them with the saved numbers.
     */
    const [form_key, setFormKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const save = async () => {
        if (
            !window.confirm(
                "Save how long chatrooms are kept? Closed rooms past either limit are deleted, the oldest first.",
            )
        )
            return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<ChatroomRetentionOverview>>(
            "/api/admin/settings/chatroom-retention",
            {
                method: "POST",
                body: { keep_days: Number(keep_days) || 0, max_per_place: Number(max_per_place) || 0 },
            },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({ error: true, msg: res?.msg || `Couldn't save it.` });
            return;
        }

        setOverview(res.singleRes);
        setKeepDays(String(res.singleRes.keep_days));
        setMaxPerPlace(String(res.singleRes.max_per_place));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: closed chatrooms are kept for ${res.singleRes.keep_days} days, ${res.singleRes.max_per_place} rooms per place.`,
        });
    };

    const discard = () => {
        setKeepDays(String(overview?.keep_days ?? ""));
        setMaxPerPlace(String(overview?.max_per_place ?? ""));
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
                key={`keep-${form_key}`}
                label="Keep closed chatrooms for"
                type="number"
                min={0}
                max={overview?.max_days}
                step={1}
                numberText
                rawNumber
                defaultValue={keep_days}
                onChange={(event) => {
                    setKeepDays(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                suffix="days"
                info={`Older closed rooms are deleted once a day. 0 uses the default (${overview?.default_days ?? ""}).`}
            />
            <Input
                key={`max-${form_key}`}
                label="Most chatrooms per place"
                type="number"
                min={0}
                max={overview?.max_per_place_ceiling}
                step={1}
                numberText
                rawNumber
                defaultValue={max_per_place}
                onChange={(event) => {
                    setMaxPerPlace(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                suffix="rooms"
                info={`Each workspace, and bots' own chats, keeps at most this many rooms; past it the oldest closed ones are deleted. 0 uses the default (${overview?.default_per_place ?? ""}).`}
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
