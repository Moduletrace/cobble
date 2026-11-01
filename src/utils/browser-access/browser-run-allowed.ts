import type { BrowserRunKind } from "@/src/dict/browser-dict";

type Params = {
    run_kind: BrowserRunKind;
    allow_routines?: number | boolean | "" | null;
};

/**
 * Whether a kind of run may reach a user's browser. Pages and payloads can
 * carry instructions, and a browser holds real logins: someone must be
 * following the run, unless its owner let routines in. Nobody follows a
 * hook call or a chatroom.
 */
export default function browserRunAllowed({ run_kind, allow_routines }: Params) {
    if (run_kind == "attended") return true;

    return run_kind == "routine" && Boolean(allow_routines);
}
