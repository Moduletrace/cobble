import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import { SiteData } from "@/src/data/site-data";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import H3 from "@moduletrace/twui/layout/H3";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";

export default function LetterFormRecipient({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_LETTERS>>) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Default Recipient</H3>

            <Input
                title="Recipient Name"
                placeholder="Eg. The Estate Manager"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        to_name: e.target.value,
                    }));
                }}
                defaultValue={form.to_name}
                showLabel
            />

            <Textarea
                title="Recipient Address"
                placeholder={`Eg. Estate Manager\n${SiteData["SiteName"]} Estate\nSagamu, Lagos State`}
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        to_address: e.target.value,
                    }));
                }}
                defaultValue={form.to_address}
                showLabel
                rows={3}
            />
        </Stack>
    );
}