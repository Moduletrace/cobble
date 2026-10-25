import Link from "@moduletrace/twui/layout/Link";

type Props = {
    url: string;
};

/**
 * A page the bot read for its background check, shown as its whole
 * address so a lookalike domain is visible before it's opened.
 */
export default function ProposalSourceRow({ url }: Props) {
    return (
        <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="block w-full py-1 text-[13px] leading-5 text-ink underline underline-offset-2 break-all hover:opacity-80"
        >
            {url}
        </Link>
    );
}
