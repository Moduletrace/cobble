import Card from "@moduletrace/twui/elements/Card";
import H3 from "@moduletrace/twui/layout/H3";
import Section from "@moduletrace/twui/layout/Section";
import Row from "@moduletrace/twui/layout/Row";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import LetterDetails from "../(partials)/letter-details";
import Stack from "@moduletrace/twui/layout/Stack";
import PdfPreview from "@/src/components/general/pdf-preview";
import LetterActions from "../../(partials)/letter-actions";

export default function LetterViewSection() {
    const { pageProps } = useContext(AppContext);

    const letter = pageProps?.letter;

    if (!letter) return null;

    return (
        <Section>
            <Stack className="w-full items-stretch">
                <Card className="flex-col items-stretch">
                    <Row className="w-full justify-between items-start">
                        <LetterActions letter={letter} is_view_letter_page />
                    </Row>

                    <LetterDetails letter={letter} />
                </Card>

                <PdfPreview
                    url="/api/admin/letters/generate-pdf"
                    body={{ letter_id: letter.id }}
                    download_name={`${letter.title || "letter"}.pdf`}
                />
            </Stack>
        </Section>
    );
}
