import { useContext, useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import { AppContext } from "@/src/pages/__root";
import type { ComputerWithStatus } from "@/src/types";
import postAdminApi from "../(functions)/post-admin-api";
import AddFormActions from "./add-form-actions";

type Props = {
    onCancel: () => void;
    /**
     * Gets the new computer (still being set up) and the server's note.
     */
    onCreated: (params: { computer: ComputerWithStatus; msg: string; linked: boolean }) => void;
};

/**
 * Creates a computer: a new sandbox container on this host, its home
 * directory kept on disk. On a workspace's pages it's linked to that
 * workspace too (unless unticked).
 */
export default function AddComputerForm({ onCancel, onCreated }: Props) {
    const { pageProps } = useContext(AppContext);
    const workspace = pageProps?.workspace;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState(Boolean(workspace?.id));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        setLoading(true);
        setError(undefined);

        const workspace_id = link && workspace?.id ? workspace.id : null;
        const res = await postAdminApi<ComputerWithStatus>({
            path: "computers/create-computer",
            body: { name, description, workspace_id },
        });

        setLoading(false);

        if (!res.success || !res.singleRes?.id) {
            setError(res.msg || "Couldn't create the computer.");
            return;
        }

        onCreated({ computer: res.singleRes, msg: res.msg || "Setting it up.", linked: Boolean(workspace_id) });
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
            {workspace?.id ? (
                <Checkbox
                    title={`Add it to ${workspace.name}`}
                    label={`Add it to ${workspace.name || "this workspace"}`}
                    checked={link}
                    changeHandler={setLink}
                />
            ) : null}
            <AddFormActions submit_label="Create computer" loading={loading} error={error} onCancel={onCancel} />
        </Form>
    );
}
