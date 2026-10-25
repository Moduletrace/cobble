import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import { PwaInstallNameMaxLength } from "@/src/data/pwa-data";
import { SiteData } from "@/src/data/site-data";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    install_name?: string | null;
};

/**
 * The name the install goes by as an installed app, saved on its own
 * without a reload. Empty puts the site name back.
 */
export default function InstallNameForm({ install_name }: Props) {
    const [saved, setSaved] = useState(install_name || "");
    const [value, setValue] = useState(install_name || "");
    const [dirty, setDirty] = useState(false);
    /**
     * The input only reads `defaultValue` when it mounts, so discarding or
     * saving remounts it with the saved name.
     */
    const [form_key, setFormKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const save = async () => {
        if (!window.confirm("Save the install name?")) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<{ install_name: string }>>(
            "/api/admin/settings/install-name",
            { method: "POST", body: { install_name: value } },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({ error: true, msg: res?.msg || `Couldn't save the name.` });
            return;
        }

        setSaved(res.singleRes.install_name);
        setValue(res.singleRes.install_name);
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: res.singleRes.install_name
                ? `Saved. Reinstall the app on a device to see "${res.singleRes.install_name}".`
                : `Removed. The app is called ${SiteData["SiteName"]} again.`,
        });
    };

    const discard = () => {
        setValue(saved);
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
                key={`install-name-${form_key}`}
                label="Install name"
                placeholder={SiteData["SiteName"]}
                maxLength={PwaInstallNameMaxLength}
                defaultValue={value}
                onChange={(event) => {
                    setValue(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                info={`Shown under the app's icon on phones and computers, e.g. "Acme". Empty uses ${SiteData["SiteName"]}. A device that already installed the app keeps the old name until it's installed again.`}
            />
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save name"
                onDiscard={discard}
            />
        </Form>
    );
}
