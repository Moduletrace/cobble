import { ComputerProxyPrefix } from "@/src/dict/computer-dict";

type Params = {
    pathname: string;
};

/**
 * Splits `/computers/<id>/<rest>` into the computer id and the path on
 * the computer (no leading slash). Null for anything else.
 */
export default function parseComputerProxyPath({ pathname }: Params) {
    const match = pathname.match(new RegExp(`^${ComputerProxyPrefix}/(\\d+)(?:/(.*))?$`));
    const computer_id = Number(match?.[1]);

    if (!match || !computer_id) return null;

    return {
        computer_id,
        prefix: `${ComputerProxyPrefix}/${computer_id}`,
        rest: match[2] || "",
    };
}
