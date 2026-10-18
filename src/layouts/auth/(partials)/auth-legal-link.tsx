import Link from "@moduletrace/twui/layout/Link";
import type { AuthLegalLinkType } from "../(data)/auth-legal-links";

export default function AuthLegalLink({ title, url }: AuthLegalLinkType) {
    return (
        <Link
            href={url}
            className="text-xs border-none text-slate-400 dark:text-slate-500"
        >
            {title}
        </Link>
    );
}
