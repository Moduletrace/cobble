import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { Plus, Upload } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { ExtensionImportApplyPayload, SkillsOverviewPayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import ExtensionBundleBar from "../../(partials)/extension-bundle-bar";
import ImportBundleModal from "../../(partials)/import-bundle-modal";
import useExtensionSelection from "../../(hooks)/use-extension-selection";
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
    const [importing, setImporting] = useState(false);
    const selection = useExtensionSelection();

    if (!overview) return null;

    const changed = (next: SkillsOverviewPayload, msg: string) => {
        setOverview(next);
        setStatus({ success: true, msg });
        setVersion((prev) => prev + 1);
    };
    const failed = (msg: string) => setStatus({ error: true, msg });
    const ids = overview.skills.map((row) => row.id);

    return (
        <SettingsGroup
            title="Skills"
            description="A runbook for a job a bot does: the steps, the checks and what good looks like. A bot sees each skill's name and when it applies; it reads the whole thing only when it loads it, so a long one costs nothing until it's needed. Give one to a bot on its settings page or in its chat, or to a workspace to reach every bot there."
        >
            {adding ? (
                <SkillModal
                    limits={overview.limits}
                    onSaved={(next, msg) => {
                        setAdding(false);
                        changed(next, msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : null}
            {overview.can_edit ? (
                <ExtensionBundleBar
                    kind="skill"
                    one="skill"
                    label="skills"
                    ids={ids}
                    selected={selection.selected}
                    onSelectAll={() => selection.all({ ids })}
                    onClear={selection.clear}
                    onExported={(msg) => setStatus({ success: true, msg })}
                    onError={failed}
                />
            ) : null}
            {importing ? (
                <ImportBundleModal
                    kind="skill"
                    label="skills"
                    onImported={(payload: ExtensionImportApplyPayload, msg) => {
                        if (payload.kind === "skill") changed(payload.overview, msg);
                    }}
                    onClose={() => setImporting(false)}
                />
            ) : null}
            <SettingsList is_empty={!overview.skills.length} empty="No skills yet.">
                {overview.skills.map((skill) => (
                    <SkillRow
                        key={`${skill.id}-${version}`}
                        selected={overview.can_edit ? selection.has({ id: skill.id }) : undefined}
                        onSelected={overview.can_edit ? (checked) => selection.toggle({ id: skill.id, checked }) : undefined}
                        skill={skill}
                        targets={overview}
                        limits={overview.limits}
                        onChanged={changed}
                        onError={failed}
                        onCopied={(msg) => setStatus({ success: true, msg })}
                    />
                ))}
            </SettingsList>
            {overview.can_edit && !adding && !importing ? (
                <Row className="flex-wrap items-center gap-2! self-start">
                    <Button
                        title="Add a skill"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        onClick={() => setAdding(true)}
                        className="gap-1!"
                    >
                        <Plus size={14} aria-hidden />
                        New skill
                    </Button>
                    <Button
                        title="Import skills from a file"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        onClick={() => setImporting(true)}
                        className="gap-1!"
                    >
                        <Upload size={14} aria-hidden />
                        Import
                    </Button>
                </Row>
            ) : null}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}