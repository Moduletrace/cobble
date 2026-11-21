import { useState } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { BookOpen, Pencil, Trash2, Users } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionTargets, PublicSkill, SkillLimitsOverview, SkillsOverviewPayload } from "@/src/types";
import ExtensionAccessModal from "../../(partials)/extension-access-modal";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowMenu from "../../(partials)/settings-row-menu";
import SettingsRowMenuItem from "../../(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "../../(partials)/settings-row-menu-panel";
import extensionAccessLabel from "../../(utils)/extension-access-label";
import updatedAgo from "../../(utils)/updated-ago";
import SkillModal from "./skill-modal";

type Props = {
    skill: PublicSkill;
    targets: ExtensionTargets;
    limits: SkillLimitsOverview;
    onChanged: (overview: SkillsOverviewPayload, msg: string) => void;
    onError: (msg: string) => void;
    /**
     * Whether it is picked for an export.
     */
    selected?: boolean;
    onSelected?: (checked: boolean) => void;
};

/**
 * One skill: its slug and when it applies, and who gets it. Its actions
 * live in the three-dot menu: edit, who gets it and deleting it.
 */
export default function SkillRow({ selected, onSelected, skill, targets, limits, onChanged, onError }: Props) {
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
                selected={selected}
                onSelected={onSelected}
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
                <SettingsRowMenu title={`${skill.name} menu`} disabled={busy}>
                    <SettingsRowMenuPanel>
                        {targets.can_edit ? (
                            <SettingsRowMenuItem icon={Pencil} title="Edit" onClick={() => setOpen("edit")} />
                        ) : null}
                        <SettingsRowMenuItem icon={Users} title="Who gets it" onClick={() => setOpen("access")} />
                        {targets.can_edit ? (
                            <SettingsRowMenuItem
                                icon={Trash2}
                                title="Delete"
                                description="Delete it. Bots lose it at once."
                                onClick={remove}
                            />
                        ) : null}
                    </SettingsRowMenuPanel>
                </SettingsRowMenu>
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
