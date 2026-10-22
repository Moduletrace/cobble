import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { SkillsOverviewPayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import SkillModal from "../(partials)/skill-modal";
import SkillRow from "../(partials)/skill-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Every skill with who gets it. Super admins add, edit and delete them;
 * admins choose which bots and workspaces get each one.
 */
export default function SkillsSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState(pageProps?.skills_overview);
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<Status>();
    /**
     * Remounts the rows when the data changes under them.
     */
    const [version, setVersion] = useState(0);

    if (!overview) return null;

    const changed = (next: SkillsOverviewPayload, msg: string) => {
        setOverview(next);
        setStatus({ success: true, msg });
        setVersion((prev) => prev + 1);
    };
    const failed = (msg: string) => setStatus({ error: true, msg });

    return (
        <SettingsGroup
            title="Skills"
            description="A runbook for a job a bot does: the steps, the checks and what good looks like. A bot sees each skill's name and when it applies; it reads the whole thing only when it loads it, so a long one costs nothing until it's needed. Give one to a bot on its settings page or in its chat, or to a workspace to reach every bot there."
        >
            {adding ? (
                <SkillModal
                    onSaved={(next, msg) => {
                        setAdding(false);
                        changed(next, msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : null}
            <SettingsList is_empty={!overview.skills.length} empty="No skills yet.">
                {overview.skills.map((skill) => (
                    <SkillRow
                        key={`${skill.id}-${version}`}
                        skill={skill}
                        targets={overview}
                        onChanged={changed}
                        onError={failed}
                    />
                ))}
            </SettingsList>
            {overview.can_edit && !adding ? (
                <Button
                    title="Add a skill"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    onClick={() => setAdding(true)}
                    className="self-start gap-1!"
                >
                    <Plus size={14} aria-hidden />
                    New skill
                </Button>
            ) : null}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
