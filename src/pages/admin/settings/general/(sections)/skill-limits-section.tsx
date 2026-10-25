import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import SkillLimitsForm from "../(partials)/skill-limits-form";

/**
 * How long a skill's runbook may be, and how much of it a bot reads at
 * once. Only the super admin sees it, since it changes every skill.
 */
export default function SkillLimitsSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Skill limits"
            description="How long a skill's runbook may be, and how much of it a bot reads when it loads the skill. A longer read costs more context on every load."
            id="skill-limits"
        >
            <SkillLimitsForm limits={pageProps?.skill_limits} />
        </SettingsGroup>
    );
}
