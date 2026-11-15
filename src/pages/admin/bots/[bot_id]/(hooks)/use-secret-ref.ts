import { useEffect, useState } from "react";
import type { SecretRefView } from "@/src/types";
import loadRefView from "../(utils)/ref-view-loader";

type Params = {
    env_id: number;
};

/**
 * A secret a bot showed (`[secret:ID]`), for its masked chip. Only the key
 * and whether the viewer may reveal it: the value is fetched on Reveal or
 * Copy and never read here. A read that failed or hung is tried again
 * (`loadRefView`), so the chip isn't left saying nothing until a reload.
 */
export default function useSecretRef({ env_id }: Params) {
    const [view, setView] = useState<SecretRefView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        setLoading(true);

        loadRefView<SecretRefView>({
            key: `secret:${env_id}`,
            url: `/api/admin/secrets/get-secret?env_id=${env_id}`,
        }).then((result) => {
            if (!live) return;
            setView(result);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [env_id]);

    return { view, loading };
}