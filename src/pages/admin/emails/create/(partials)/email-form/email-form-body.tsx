import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import TinyMCEEditor from "@moduletrace/twui/editors/TinyMCE";
import H3 from "@moduletrace/twui/layout/H3";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";

export default function EmailFormBody({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_EMAILS>>) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Email Body</H3>

            <TinyMCEEditor
                defaultValue={form.body_html}
                changeHandler={(content) => {
                    setForm((prev) => ({
                        ...prev,
                        body_html: content,
                    }));
                }}
                placeholder="Write the HTML body of the email here"
                options={{ height: 400 }}
                name="Email Body"
                showLabel
            />
        </Stack>
    );
}