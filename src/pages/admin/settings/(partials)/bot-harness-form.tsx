import { useState } from "react";
import type { BotWithLastMessage, HarnessOverview } from "@/src/types";
import HarnessSettingsForm from "@/src/pages/admin/settings/models/(partials)/harness-settings-form";
import postHarnessApi from "@/src/pages/admin/settings/models/(functions)/post-harness-api";
import saveBotHarnessSettings from "@/src/functions/frontend/save-bot-harness-settings";
import saveWorkspaceHarnessSettings from "@/src/functions/frontend/save-workspace-harness-settings";

type Props = {
    bot: BotWithLastMessage;
    /**
     * In a workspace the form saves the workspace's models, for every bot
     * working there.
     */
    workspace_id?: number | null;
    /**
     * A worker's `grabBotHarnessOverview`; for the coordinator, the
     * defaults (`grabHarnessOverview`).
     */
    harnesses: HarnessOverview[];
    /**
     * Gets the fresh harnesses after each save.
     */
    onSaved?: (harnesses: HarnessOverview[]) => void;
};

/**
 * The Models settings form (`HarnessSettingsForm`) for one bot. A worker
 * saves its own picks ("same as the default" drops one). The coordinator
 * runs on the defaults, so it saves the defaults themselves, which only a
 * super admin can.
 */
export default function BotHarnessForm({ bot, workspace_id, harnesses: initial, onSaved }: Props) {
    const [harnesses, setHarnesses] = useState(initial);
    /**
     * Remounts the form when the data changes under it.
     */
    const [version, setVersion] = useState(0);
    const [notice, setNotice] = useState<string>();

    const saved = (fresh: HarnessOverview[], msg?: string) => {
        setHarnesses(fresh);
        setNotice(msg || "Saved.");
        setVersion((prev) => prev + 1);
        onSaved?.(fresh);
    };

    return (
        <HarnessSettingsForm
            key={version}
            harnesses={harnesses}
            notice={notice}
            save={async ({ settings }) => {
                if (workspace_id) {
                    const res = await saveWorkspaceHarnessSettings({
                        workspace_id,
                        settings: settings.map((setting) => ({
                            ...setting,
                            inherit: Boolean(setting.inherit),
                        })),
                    });

                    if (res.success && res.singleRes) saved(res.singleRes.harnesses, res.msg);

                    return res;
                }

                if (bot.kind == "coordinator") {
                    const res = await postHarnessApi({
                        path: "save-settings",
                        body: { settings },
                    });

                    if (res.success && res.singleRes) saved(res.singleRes.harnesses, res.msg);

                    return res;
                }

                const res = await saveBotHarnessSettings({
                    bot_id: Number(bot.id),
                    settings: settings.map((setting) => ({
                        ...setting,
                        inherit: Boolean(setting.inherit),
                    })),
                });

                if (res.success && res.singleRes) saved(res.singleRes.harnesses, res.msg);

                return res;
            }}
        />
    );
}
