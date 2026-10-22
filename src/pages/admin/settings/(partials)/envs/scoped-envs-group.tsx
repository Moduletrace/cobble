import { useState } from "react";
import type { EnvsMutationResult, ScopedEnvsPayload } from "@/src/types";
import EnvsGroup from "./envs-group";

type Props = {
    /**
     * A bot's own envs, or a workspace's. `null` when the viewer can't
     * manage them, so the group isn't rendered at all.
     */
    initial?: ScopedEnvsPayload | null;
};

/**
 * The envs set on one bot or one workspace, on its settings page. Super
 * admins only, like the Environment page.
 */
export default function ScopedEnvsGroup({ initial }: Props) {
    const [data, setData] = useState<ScopedEnvsPayload | null>(initial || null);
    const [status, setStatus] = useState<{
        error?: boolean;
        success?: boolean;
        msg?: string;
    }>();

    if (!data?.can_manage) return null;

    const changed = (result: EnvsMutationResult, msg: string) => {
        if (result.scoped) setData(result.scoped);
        setStatus({ success: true, msg });
    };

    return (
        <EnvsGroup
            scope={data.scope}
            envs={data.envs}
            scoped
            status={status}
            onChanged={changed}
            onError={(msg) => setStatus({ error: true, msg })}
        />
    );
}
