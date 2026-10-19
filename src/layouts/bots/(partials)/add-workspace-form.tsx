import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import ImagePickField from "@/src/components/general/image-pick-field";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import setProfileImage from "@/src/functions/frontend/set-profile-image";
import postAdminApi from "../(functions)/post-admin-api";
import usePickedImage from "../(hooks)/use-picked-image";
import AddFormActions from "./add-form-actions";

type Props = {
    onCancel: () => void;
};

/**
 * Creates a workspace: its picture, name, one line on what it's for, and
 * the context every bot working there gets. Opens the new workspace.
 */
export default function AddWorkspaceForm({ onCancel }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [system_prompt, setSystemPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const image = usePickedImage({});

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(`Create ${name || "this workspace"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<{ workspace_id: number }>({
            path: "workspaces/create-workspace",
            body: { name, description, system_prompt },
        });

        if (!res.success || !res.singleRes?.workspace_id) {
            setLoading(false);
            setError(res.msg || "Couldn't create the workspace.");
            return;
        }

        const workspace_id = res.singleRes.workspace_id;

        if (image.data_url) {
            await setProfileImage({ target: "workspace", id: workspace_id, data_url: image.data_url }).catch(() => null);
        }

        window.location.href = `/admin/settings/workspaces/${workspace_id}`;
    };

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
            <ImagePickField
                preview={<WorkspaceAvatar size="lg" src={image.data_url} />}
                has_image={image.has_image}
                onPick={image.pick}
                onRemove={image.remove}
                disabled={loading}
                note="Optional. A logo or any picture that says what it is."
            />
            <Input
                id="add-workspace-name"
                title="Name"
                label="Name"
                showLabel
                placeholder="Spring launch"
                autoComplete="off"
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input
                id="add-workspace-description"
                title="What it's for"
                label="What it's for"
                showLabel
                placeholder="Everything for the April release"
                autoComplete="off"
                defaultValue={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <Textarea
                id="add-workspace-instructions"
                title="Context"
                label="Context"
                showLabel
                rows={5}
                placeholder="We ship on April 14. The repo is acme/launch. Marketing signs off on all copy."
                defaultValue={system_prompt}
                info="Every bot working here gets this. You can change it later."
                onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <AddFormActions submit_label="Create workspace" loading={loading} error={error} onCancel={onCancel} />
        </Form>
    );
}
