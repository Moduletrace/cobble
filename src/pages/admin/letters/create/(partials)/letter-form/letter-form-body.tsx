import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import TinyMCEEditor from "@moduletrace/twui/editors/TinyMCE";
import H3 from "@moduletrace/twui/layout/H3";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";

export default function LetterFormBody({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_LETTERS>>) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Letter Body</H3>

            <TinyMCEEditor
                defaultValue={form.body_html}
                changeHandler={(content) => {
                    setForm((prev) => ({
                        ...prev,
                        body_html: content,
                    }));
                }}
                placeholder="Write the body of the letter here"
                options={{ height: 400 }}
                name="Letter Body"
                showLabel
            />
        </Stack>
    );
}