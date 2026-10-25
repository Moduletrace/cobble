import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import { AppData } from "@/src/data/app-data";
import type { HookCallRetentionOverview } from "@/src/types";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    retention?: HookCallRetentionOverview | null;
};

/**
 * How many days hook calls are kept, saved on its own without a reload.
 * Zero puts the code's default back.
 */
export default function HookCallRetentionForm({ retention }: Props) {
    const [overview, setOverview] = useState(retention || undefined);
    const [dirty, setDirty] = useState(false);
    const [keep_days, setKeepDays] = useState(String(retention?.keep_days ?? ""));
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
        if (!window.confirm("Save how long hook calls are kept? Calls older than that are deleted at the next daily prune.")) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<HookCallRetentionOverview>>(
            "/api/admin/settings/hook-call-retention",
            {
                method: "POST",
                body: { keep_days: Number(keep_days) || 0 },
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
        setKeepDays(String(res.singleRes.keep_days));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: hook calls are kept for ${res.singleRes.keep_days} days.`,
        });
    };

    const discard = () => {
        setKeepDays(String(overview?.keep_days ?? ""));
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
                label="Keep hook calls for"
                type="number"
                min={0}
                max={overview?.max}
                step={1}
                numberText
                rawNumber
                defaultValue={keep_days}
                onChange={(event) => {
                    setKeepDays(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                suffix={`days`}
                info={`Each call keeps its payload (up to ${AppData.BotHookMaxPayloadBytes / 1024} KB) and its run's response, so a long time on a busy hook grows the database. 0 uses the default (${overview?.default_days ?? ""}).`}
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
