import { useContext, useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Row from "@moduletrace/twui/layout/Row";
import { AppData } from "@/src/data/app-data";
import { AppContext } from "@/src/pages/__root";
import type { ComputerWithStatus } from "@/src/types";
import postAdminApi from "../(functions)/post-admin-api";
import AddFormActions from "./add-form-actions";

type Props = {
    /**
     * Edits this computer; creates one when not given.
     */
    computer?: ComputerWithStatus;
    onCancel: () => void;
    /**
     * Gets the new computer (still being set up) and the server's note.
     */
    onCreated?: (params: { computer: ComputerWithStatus; msg: string; linked: boolean }) => void;
    /**
     * Gets the saved computer and the server's note.
     */
    onUpdated?: (params: { computer: ComputerWithStatus; msg: string }) => void;
};

/**
 * Creates a computer (a new sandbox container on this host, its home
 * directory kept on disk) or edits one: its name, what it's for, and the
 * CPUs and memory its container gets. On a workspace's pages a new one is
 * linked to that workspace too (unless unticked). New resources restart
 * the computer; its files stay.
 */
export default function AddComputerForm({ computer, onCancel, onCreated, onUpdated }: Props) {
    const { pageProps } = useContext(AppContext);
    const workspace = computer ? null : pageProps?.workspace;

    const [name, setName] = useState(computer?.name || "");
    const [description, setDescription] = useState(computer?.description || "");
    const [cpus, setCpus] = useState(String(Number(computer?.cpus) || AppData.ComputerDefaultCpus));
    const [memory_gb, setMemoryGb] = useState(
        String((Number(computer?.memory_mb) || AppData.ComputerDefaultMemoryMb) / 1024),
    );
    const [link, setLink] = useState(Boolean(workspace?.id));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        setLoading(true);
        setError(undefined);

        const resources = {
            cpus: Number(cpus),
            memory_mb: Math.round(Number(memory_gb) * 1024),
        };

        const workspace_id = link && workspace?.id ? workspace.id : null;
        const res = computer?.id
            ? await postAdminApi<ComputerWithStatus>({
                  path: "computers/update-computer",
                  body: { computer_id: computer.id, name, description, ...resources },
              })
            : await postAdminApi<ComputerWithStatus>({
                  path: "computers/create-computer",
                  body: { name, description, workspace_id, ...resources },
              });

        setLoading(false);

        if (!res.success || !res.singleRes?.id) {
            setError(res.msg || "Couldn't save the computer.");
            return;
        }

        if (computer?.id) {
            onUpdated?.({ computer: res.singleRes, msg: res.msg || "Saved." });
            return;
        }

        onCreated?.({ computer: res.singleRes, msg: res.msg || "Setting it up.", linked: Boolean(workspace_id) });
    };

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
            <Input
                id="add-computer-name"
                title="Name"
                label="Name"
                showLabel
                placeholder="Research box"
                autoComplete="off"
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input
                id="add-computer-description"
                title="What it's for"
                label="What it's for"
                showLabel
                placeholder="Browsing and downloads for the launch"
                autoComplete="off"
                defaultValue={description}
                info="Bots see this when they pick a computer."
                onChange={(e) => setDescription(e.target.value)}
            />
            <Row className="w-full gap-4! flex-nowrap items-start">
                <Input
                    id="add-computer-cpus"
                    title="CPUs"
                    label="CPUs"
                    showLabel
                    type="number"
                    min={AppData.ComputerMinCpus}
                    max={AppData.ComputerMaxCpus}
                    step={0.25}
                    defaultValue={cpus}
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    onChange={(e) => setCpus(e.target.value)}
                />
                <Input
                    id="add-computer-memory"
                    title="Memory (GB)"
                    label="Memory (GB)"
                    showLabel
                    type="number"
                    min={AppData.ComputerMinMemoryMb / 1024}
                    step={0.5}
                    defaultValue={memory_gb}
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    onChange={(e) => setMemoryGb(e.target.value)}
                />
            </Row>
            {workspace?.id ? (
                <Checkbox
                    title={`Add it to ${workspace.name}`}
                    label={`Add it to ${workspace.name || "this workspace"}`}
                    checked={link}
                    changeHandler={setLink}
                />
            ) : null}
            <AddFormActions
                submit_label={computer?.id ? "Save" : "Create computer"}
                loading={loading}
                error={error}
                onCancel={onCancel}
            />
        </Form>
    );
}
