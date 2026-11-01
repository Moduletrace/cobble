import { useEffect, useState } from "react";
import Select from "@moduletrace/twui/form/Select";
import Span from "@moduletrace/twui/layout/Span";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { HookPlace } from "@/src/types";

type Props = {
    bot_id: number;
    workspace_id: number | null;
    disabled?: boolean;
    onChange: (params: { workspace_id: number | null }) => void;
};

/**
 * Where a hook's calls run: the bot's own chat or one of its workspaces
 * (loaded when the form opens). Their results stay in the hook's thread
 * either way.
 */
export default function HookPlaceFields({ bot_id, workspace_id, disabled, onChange }: Props) {
    const [places, setPlaces] = useState<HookPlace[]>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        postAdminApi<HookPlace>({ path: "hooks/hook-places", body: { bot_id } }).then((res) => {
            if (!res.success) setError(res.msg || "Couldn't load where it can run.");

            setPlaces((res.payload || []) as HookPlace[]);
        });
    }, [bot_id]);

    return (
        <>
            {places?.length ? (
                <Select
                    key={`place-${places.length}`}
                    id="hook-place"
                    title="Runs in"
                    label="Runs in"
                    showLabel
                    disabled={disabled}
                    info="Decides the bot's workspace context and computers. Results never show in a chat: open the hook to read them."
                    options={places.map((it) => ({
                        value: String(it.workspace_id ?? "own"),
                        title: it.name,
                        default: it.workspace_id == workspace_id,
                    }))}
                    changeHandler={(value) => onChange({ workspace_id: value == "own" ? null : Number(value) })}
                />
            ) : null}
            {error ? <Span className="text-[13px] leading-[18px] text-ink-secondary">{error}</Span> : null}
        </>
    );
}
