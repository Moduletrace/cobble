import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import CopyFromExistingSelect from "@/src/components/general/copy-from-existing-select";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Tag from "@moduletrace/twui/elements/Tag";
import Form from "@moduletrace/twui/form/Form";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import useFormInit from "@/src/hooks/use-form-init";
import { useEffect } from "react";
import submitLetter from "../../(functions)/submit-letter";
import LetterFormAction from "./letter-form-action";
import LetterFormBody from "./letter-form-body";
import LetterFormLetterParts from "./letter-form-letter-parts";
import LetterFormRecipient from "./letter-form-recipient";
import LetterFormSender from "./letter-form-sender";
import LoadingRectangleBlock from "@moduletrace/twui/layout/LoadingRectangleBlock";
import Row from "@moduletrace/twui/layout/Row";
import LetterFormTitle from "./letter-form-title";

type Props = {
    existing_letter?: BUN_SQLITE_BSQLITE_LETTERS;
};

export default function LetterForm({ existing_letter }: Props) {
    const init = useFormInit<BUN_SQLITE_BSQLITE_LETTERS>({
        existing: existing_letter,
        existing_full: existing_letter,
        title: "Letter",
        async before_ready_function(ctx) {
            if (existing_letter?.id) return;

            const params = new URLSearchParams(window.location.search);
            const from_id = params.get("from");

            if (!from_id) return;

            const res =
                await adminCrudHandler<BUN_SQLITE_BSQLITE_LETTERS>({
                    action: "get",
                    table: "letters",
                    id: from_id,
                });

            const record = res.singleRes;

            if (record) {
                setForm(record);
            }
        },
    });

    const { loading, status, ready, setForm, setReady } = init;

    useEffect(() => {
        if (!ready) return;
    }, [ready]);

    return (
        <>
            <Form
                className="w-full gap-6"
                onSubmit={() => {
                    submitLetter(init);
                }}
            >
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {loading && <LoadingOverlay />}

                {!existing_letter?.id ? (
                    <Row className="w-full justify-end">
                        <CopyFromExistingSelect<BUN_SQLITE_BSQLITE_LETTERS>
                            table="letters"
                            title="Copy from Existing Letter"
                            onSelect={(record) => {
                                setReady(false);

                                setForm(record);

                                setTimeout(() => {
                                    setReady(true);
                                }, 500);
                            }}
                            onClear={() => {
                                setReady(false);

                                setForm({});

                                setTimeout(() => {
                                    setReady(true);
                                }, 500);
                            }}
                        />
                    </Row>
                ) : null}

                {init.ready ? (
                    <>
                        <LetterFormTitle {...init} />
                        <LetterFormSender {...init} />
                        <LetterFormRecipient {...init} />
                        <LetterFormLetterParts {...init} />
                        <LetterFormBody {...init} />
                        <LetterFormAction {...init} />
                    </>
                ) : (
                    <LoadingRectangleBlock className="h-[700px]" />
                )}
            </Form>
        </>
    );
}
