import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Row from "@moduletrace/twui/layout/Row";
import { useState } from "react";
import { BotHookEventStatuses, type BotHookEventStatus } from "@/src/dict/bot-hook-dict";

type Props = {
    loading?: boolean;
    onSearch: (query: string) => void;
    onStatus: (status: BotHookEventStatus | "") => void;
};

/**
 * Narrowing a hook's calls down: words in what a call sent or what its
 * run answered (Enter, or clearing, runs it), and one status.
 */
export default function HookCallsFilters({ loading, onSearch, onStatus }: Props) {
    const [value, set_value] = useState("");

    return (
        <Row className="w-full mb-2 gap-2! flex-wrap items-start md:flex-nowrap">
            <Input
                placeholder="Search what calls sent and what runs answered"
                value={value}
                disabled={loading}
                onChange={(event) => set_value(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key == "Enter") onSearch(event.currentTarget.value.trim());
                }}
                clearInputProps={{
                    onClick: () => {
                        set_value("");
                        onSearch("");
                    },
                }}
                wrapperWrapperProps={{ className: "w-full grow" }}
            />
            <Select
                title="Only calls with this status"
                aria-label="Only calls with this status"
                options={[
                    { title: "Any status", value: "", default: true },
                    ...BotHookEventStatuses.map((option) => ({ title: option.title, value: option.value })),
                ]}
                changeHandler={(next) => onStatus(next as BotHookEventStatus | "")}
                wrapperWrapperProps={{ className: "w-[150px] shrink-0" }}
            />
        </Row>
    );
}
