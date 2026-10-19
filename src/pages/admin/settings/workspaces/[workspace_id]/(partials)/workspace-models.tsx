import { useState } from "react";
import type { HarnessOverview } from "@/src/types";
import HarnessSettingsForm from "@/src/pages/admin/settings/models/(partials)/harness-settings-form";
import saveWorkspaceHarnessSettings from "@/src/functions/frontend/save-workspace-harness-settings";

type Props = {
    workspace_id: number;
    harnesses: HarnessOverview[];
};

/**
 * Which model each harness uses in the workspace. These win over a bot's
 * own models; "Same as the default" leaves each bot on its own, else the
 * defaults.
 */
export default function WorkspaceModels({ workspace_id, harnesses: initial }: Props) {
    const [harnesses, setHarnesses] = useState(initial);
    const [version, setVersion] = useState(0);
    const [notice, setNotice] = useState<string>();

    return (
        <HarnessSettingsForm
            key={version}
            harnesses={harnesses}
            notice={notice}
            save={async ({ settings }) => {
                const res = await saveWorkspaceHarnessSettings({
                    workspace_id,
                    settings: settings.map((setting) => ({ ...setting, inherit: Boolean(setting.inherit) })),
                });

                if (res.success && res.singleRes) {
                    setHarnesses(res.singleRes.harnesses);
                    setNotice(res.msg || "Saved.");
                    setVersion((prev) => prev + 1);
                }

                return res;
            }}
        />
    );
}
