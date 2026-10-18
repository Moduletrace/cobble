import { useEffect, useState } from "react";
import readSSOPendingLogin from "@/src/functions/frontend/read-sso-pending-login";
import type { SSOPendingLogin } from "@/src/types";

export default function useSSOPendingLogin() {
    const [pending, setPending] = useState<SSOPendingLogin>();

    useEffect(() => {
        setPending(readSSOPendingLogin());
    }, []);

    return pending;
}
