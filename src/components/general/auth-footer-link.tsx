import { twMerge } from "tailwind-merge";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Link from "@moduletrace/twui/layout/Link";

type Props = {
    prompt: string;
    title: string;
    url: string;
    className?: string;
};

export default function AuthFooterLink({
    prompt,
    title,
    url,
    className,
}: Props) {
    return (
        <Row className={twMerge("justify-center gap-1.5", className)}>
            <Span variant="faded">{prompt}</Span>
            <Link href={url}>{title}</Link>
        </Row>
    );
}
