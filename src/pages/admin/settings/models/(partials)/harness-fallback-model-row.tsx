import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { X } from "lucide-react";
import RowIconButton from "@/src/components/general/row-icon-button";

type Props = {
    name: string;
    provider_name: string;
    onRemove: () => void;
};

/**
 * One saved backup: the model and its provider, with the way to take it
 * off the list.
 */
export default function HarnessFallbackModelRow({ name, provider_name, onRemove }: Props) {
    return (
        <Row className="w-full gap-3! items-center justify-between rounded-default border border-solid border-hairline px-3 py-2">
            <Stack className="gap-0! min-w-0">
                <Span className="truncate text-sm text-ink">{name}</Span>
                <Span className="truncate text-xs text-ink-secondary">{provider_name}</Span>
            </Stack>
            <RowIconButton icon={X} title={`Remove ${name}`} onClick={onRemove} />
        </Row>
    );
}