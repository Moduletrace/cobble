import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { BookOpen } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionTargets, PublicSkill, SkillLimitsOverview, SkillsOverviewPayload } from "@/src/types";
import ExtensionAccessModal from "../../(partials)/extension-access-modal";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";
import extensionAccessLabel from "../../(utils)/extension-access-label";
import updatedAgo from "../../(utils)/updated-ago";
import SkillModal from "./skill-modal";

type Props = {
    skill: PublicSkill;
    targets: ExtensionTargets;
    limits: SkillLimitsOverview;
    onChanged: (overview: SkillsOverviewPayload, msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * One skill: its slug and when it applies, and who gets it. Edit and Access
 * open in a modal.
 */
export default function SkillRow({ skill, targets, limits, onChanged, onError }: Props) {
    const [open, setOpen] = useState<"edit" | "access">();
    const [busy, setBusy] = useState(false);

    const saved = (overview: SkillsOverviewPayload, msg: string) => {
        setOpen(undefined);
        onChanged(overview, msg);
    };

    const remove = async () => {
        if (busy || !window.confirm(`Delete ${skill.name}? Bots lose it at once.`)) return;

        setBusy(true);
        const res = await postAdminApi<SkillsOverviewPayload>({
            path: "skills/delete-skill",
            body: { skill_id: skill.id },
        });
        setBusy(false);

        if (res.success && res.singleRes) onChanged(res.singleRes, res.msg || "Deleted.");
        else onError(res.msg || "Couldn't delete the skill.");
    };

    return (
        <Stack className="w-full gap-0! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
            <SettingsListRow
                avatar={<IconTile Icon={BookOpen} />}
                title={skill.name}
                badge={skill.enabled ? undefined : "Off"}
                subtitle={[
                    skill.slug,
                    extensionAccessLabel({ access: skill.access }),
                    updatedAgo({ at: skill.updated_at }),
                    skill.description,
                ]
                    .filter(Boolean)
                    .join(" · ")}
            >
                {targets.can_edit ? (
                    <SettingsRowAction
                        title={`Edit ${skill.name}`}
                        label="Edit"
                        disabled={busy}
                        onClick={() => setOpen(open == "edit" ? undefined : "edit")}
                    />
                ) : null}
                <SettingsRowAction
                    title={`Choose who gets ${skill.name}`}
                    label="Access"
                    disabled={busy}
                    onClick={() => setOpen(open == "access" ? undefined : "access")}
                />
                {targets.can_edit ? (
                    <SettingsRowAction title={`Delete ${skill.name}`} label="Delete" disabled={busy} onClick={remove} />
                ) : null}
            </SettingsListRow>
            {open == "edit" ? (
                <SkillModal skill={skill} limits={limits} onSaved={saved} onCancel={() => setOpen(undefined)} />
            ) : null}
            {open == "access" ? (
                <ExtensionAccessModal<SkillsOverviewPayload>
                    id={skill.id}
                    name={skill.name}
                    access={skill.access}
                    targets={targets}
                    path="skills/set-skill-access"
                    onSaved={saved}
                    onCancel={() => setOpen(undefined)}
                />
            ) : null}
        </Stack>
    );
}
