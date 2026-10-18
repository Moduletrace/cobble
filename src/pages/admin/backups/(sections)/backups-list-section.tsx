import EmptyContent from "@moduletrace/twui/elements/EmptyContent";
import Section from "@moduletrace/twui/layout/Section";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import BackupsTable, { type BackupsTableMode } from "../(partials)/backups-table";

type Props = {
    mode: BackupsTableMode;
};

export default function BackupsListSection({ mode }: Props) {
    const { pageProps } = useContext(AppContext);

    const backups = pageProps?.backups || [];

    return (
        <Section>
            <Stack className="w-full items-stretch">
                <Span size="small" variant="faded">
                    {`${backups.length} backup${backups.length == 1 ? "" : "s"}`}
                </Span>
                {backups[0] ? (
                    <BackupsTable backups={backups} mode={mode} />
                ) : (
                    <EmptyContent title="No backups yet" />
                )}
            </Stack>
        </Section>
    );
}
