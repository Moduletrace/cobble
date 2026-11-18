import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { HostDirectoryWithLinks } from "@/src/types";

type Props = {
    /**
     * Edits this one; adds one when not given.
     */
    directory?: HostDirectoryWithLinks;
    /**
     * Its message once it is saved.
     */
    onSaved: (msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits a folder on the host machine: its name, and its path there
 * as the host sees it. Nothing is mounted until it is linked.
 */
export default function HostDirectoryModal({
    directory,
    onSaved,
    onCancel,
}: Props) {
    const [name, setName] = useState(directory?.name || "");
    const [source, setSource] = useState(directory?.source || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const id = `host-directory-${directory?.id || "new"}`;

    const submit = async () => {
        if (loading) return;

        if (
            directory &&
            !window.confirm(`Save ${directory.name}?`)
        ) {
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi({
            path: directory
                ? "host-directories/update-host-directory"
                : "host-directories/create-host-directory",
            body: directory
                ? { host_directory_id: directory.id, name, source }
                : { name, source },
        });

        setLoading(false);

        if (!res.success) {
            setError(res.msg || "Couldn't save it.");
            return;
        }

        onSaved(res.msg || "Saved.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={directory ? `Edit ${directory.name}` : "Add a host directory"}
            description="A folder on the machine Cobble runs on, mounted inside the computers your bots work on. They read and write it as themselves, so its owner decides what they may do there."
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id={`${id}-name`}
                    title="Name"
                    label="Name"
                    showLabel
                    placeholder="Client documents"
                    defaultValue={name}
                    autoComplete="off"
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    id={`${id}-source`}
                    title="Path on the host machine"
                    label="Path on the host machine"
                    showLabel
                    placeholder="/home/you/Documents"
                    defaultValue={source}
                    autoComplete="off"
                    info="The absolute path as the host sees it, not as a computer inside Cobble does."
                    onChange={(e) => setSource(e.target.value)}
                />
                <Stack className="gap-1! items-stretch">
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        Bots see it at <Span className="font-mono">hosts/&lt;name&gt;</Span>{" "}
                        in their own folder, or in their workspace&apos;s shared
                        folder. Renaming it keeps that place, so nothing a bot
                        saved by path breaks.
                    </Span>
                </Stack>
                <AddFormActions
                    submit_label={directory ? "Save" : "Add it"}
                    loading={loading}
                    error={error}
                    onCancel={onCancel}
                />
            </Form>
        </AddModalShell>
    );
}