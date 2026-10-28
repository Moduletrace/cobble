import type { ComponentProps } from "react";
import Link from "@moduletrace/twui/layout/Link";
import MarkdownLink from "./markdown-link";

/**
 * A link in the user's own message: refs (bots, workspaces) as their
 * chips (`MarkdownLink`), anything else underlined in the bubble's ink.
 */
export default function UserMarkdownLink(props: ComponentProps<"a">) {
    if (props.href?.startsWith("#")) return <MarkdownLink {...props} />;

    return (
        <Link
            href={props.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 dark:text-blue-600 underline underline-offset-2 hover:opacity-80 wrap-anywhere"
        >
            {props.children}
        </Link>
    );
}
