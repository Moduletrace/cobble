import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import type { TWUIStatusType } from "@moduletrace/twui/hooks/useStatus";
import { sendEmailRecord } from "@/src/functions/frontend/document-actions";
import type { Dispatch, SetStateAction } from "react";

type Params = {
    email: BUN_SQLITE_BSQLITE_EMAILS;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setStatus?: Dispatch<SetStateAction<TWUIStatusType | undefined>>;
    refresh?: () => void;
};

export default async function clientSendEmail({
    email,
    setLoading,
    setStatus,
    refresh,
}: Params) {
    setStatus?.(undefined);

    if (!window.confirm(`Send this email now?`)) {
        return;
    }

    setLoading(true);

    const res = await sendEmailRecord({
        url: "/api/admin/emails/send-email",
        body: {
            email_id: email.id,
        },
    });

    if (res.success) {
        setStatus?.({
            error: false,
            success: true,
            msg: res.msg || "Email sent",
        });
        refresh?.();
    } else {
        setStatus?.({
            error: true,
            msg: res.msg || "Couldn't send email",
        });
        setLoading(false);
    }
}
