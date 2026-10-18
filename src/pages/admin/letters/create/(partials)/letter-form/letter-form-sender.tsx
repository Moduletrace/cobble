import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import { SiteData } from "@/src/data/site-data";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import H3 from "@moduletrace/twui/layout/H3";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";

export default function LetterFormSender({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_LETTERS>>) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Sender (Letterhead)</H3>

            <Input
                title="Sender Name"
                placeholder={`Eg. ${SiteData["SiteName"]} - Accounts Department`}
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        from_name: e.target.value,
                    }));
                }}
                defaultValue={form.from_name}
                showLabel
            />

            <Textarea
                title="Sender Address"
                placeholder={`Eg. ${SiteData["SiteName"]}\n17, Akins Street, Ilashe\nSagamu, Lagos State`}
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        from_address: e.target.value,
                    }));
                }}
                defaultValue={form.from_address}
                showLabel
                rows={3}
            />
        </Stack>
    );
}