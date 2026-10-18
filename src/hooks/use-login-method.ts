import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import type { LoginMethod } from "@/src/types";

/**
 * Site-wide login method from `AUTH_LOGIN_METHOD`, passed down by
 * `__root.server.ts`.
 */
export default function useLoginMethod(): LoginMethod {
    const { pageProps } = useContext(AppContext);

    return pageProps?.envs?.AUTH_LOGIN_METHOD == "password" ? "password" : "code";
}
