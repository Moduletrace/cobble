import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Monitor } from "lucide-react";
import InlineAddSelect from "@/src/components/general/inline-add-select";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BotWithLastMessage, ComputerWithStatus } from "@/src/types";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsList from "../../../(partials)/settings-list";
import SettingsStatus from "../../../(partials)/settings-status";
import BotComputerRow from "./bot-computer-row";

type Props = {
    bot: BotWithLastMessage;
    /**
     * Computers it can use in its own chat.
     */
    computers: ComputerWithStatus[];
    /**
     * Every computer the user has.
     */
    all_computers: ComputerWithStatus[];
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * The bot's direct computer access. In a workspace it uses that
 * workspace's computers instead; the coordinator can use every computer.
 */
export default function BotComputersGroup({
    bot,
    computers: initial,
    all_computers,
}: Props) {
    const [computers, setComputers] = useState(initial);
    const [busy_id, setBusyId] = useState<number | "add">();
    const [status, setStatus] = useState<Status>();
    const is_coordinator = bot.kind == "coordinator";

    const addable = all_computers.filter(
        (computer) => !computers.some((item) => item.id == computer.id),
    );

    const change = async ({
        path,
        computer_id,
    }: {
        path: "add-computer" | "remove-computer";
        computer_id: number;
    }) => {
        setBusyId(path == "add-computer" ? "add" : computer_id);
        setStatus(undefined);

        const res = await postAdminApi({
            path: `bots/${path}`,
            body: { bot_id: bot.id, computer_id },
        });

        setBusyId(undefined);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        if (path == "add-computer") {
            const computer = all_computers.find(
                (item) => Number(item.id) == computer_id,
            );

            if (computer) {
                setComputers((prev) => [...prev, computer]);
            }
        } else {
            setComputers((prev) =>
                prev.filter((computer) => Number(computer.id) != computer_id),
            );
        }

        setStatus({ success: true, msg: res.msg || "Saved." });
    };

    return (
        <SettingsGroup
            id="computers"
            title="Computers"
            description={
                is_coordinator
                    ? "The coordinator can use every computer."
                    : "Direct access for its own chat. In a workspace it uses that workspace's computers instead."
            }
        >
            <SettingsList
                is_empty={!computers.length}
                empty={
                    is_coordinator
                        ? "No computers yet."
                        : "No direct computer access yet."
                }
            >
                {computers.map((computer) => (
                    <BotComputerRow
                        key={computer.id}
                        computer={computer}
                        busy={busy_id == computer.id}
                        onRemove={
                            is_coordinator
                                ? undefined
                                : () =>
                                      change({
                                          path: "remove-computer",
                                          computer_id: Number(computer.id),
                                      })
                        }
                    />
                ))}
            </SettingsList>
            {is_coordinator ? null : (
                <InlineAddSelect
                    id="bot-add-computer"
                    noun="computer"
                    options={addable.map((computer) => ({
                        value: String(computer.id),
                        title:
                            computer.name || `Computer ${computer.id}`,
                    }))}
                    loading={busy_id == "add"}
                    onAdd={({ value }) =>
                        change({
                            path: "add-computer",
                            computer_id: Number(value),
                        })
                    }
                />
            )}
            <Button
                title="Manage your computers"
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                href="/admin/settings/computers"
                beforeIcon={<Monitor size={14} aria-hidden />}
                className="self-start gap-1!"
            >
                Manage computers
            </Button>
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
