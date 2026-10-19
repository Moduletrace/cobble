import Stack from "@moduletrace/twui/layout/Stack";
import LogsList from "../(partials)/logs-list";

export default function LogsListSection() {
    return (
        <Stack className="w-full items-stretch py-8">
            <LogsList />
        </Stack>
    );
}
