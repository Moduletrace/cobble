import type { ReactNode } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    eyebrow: string;
    title: string;
    description?: ReactNode;
};

export default function AuthHero({ eyebrow, title, description }: Props) {
    return (
        <Stack className="w-full items-center gap-4!">
            <Span className="htag">{eyebrow}</Span>
            <H1 className="text-center text-3xl! sm:text-4xl! tracking-[-0.035em]">
                {title}
            </H1>
            {description ? (
                <Span className="text-base text-slate-500 dark:text-slate-400 leading-snug text-center max-w-md">
                    {description}
                </Span>
            ) : null}
        </Stack>
    );
}
