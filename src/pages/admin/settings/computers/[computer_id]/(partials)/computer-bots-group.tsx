import { useState } from "react";
import InlineAddSelect from "@/src/components/general/inline-add-select";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import type { BotWithLastMessage, ComputerWithStatus } from "@/src/types";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import isLockedComputerAccess from "@/src/utils/is-locked-computer-access";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsList from "../../../(partials)/settings-list";
import SettingsStatus from "../../../(partials)/settings-status";
import ComputerBotRow from "./computer-bot-row";

type Props = {
    computer: ComputerWithStatus;
    /**
     * Every bot the user has, for adding one.
     */
    bots: BotWithLastMessage[];
    /**
     * Bots with direct access now.
     */
    computer_bots: BUN_SQLITE_COBBLE_BOTS[];
    is_super_admin: boolean;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * Bots with direct access to the computer. The coordinator can use every
 * computer; in a workspace, every bot there uses the workspace's
 * computers instead.
 */
export default function ComputerBotsGroup({
    computer,
    bots,
    computer_bots: initial,
    is_super_admin,
}: Props) {
    const [computer_bots, setComputerBots] = useState(initial);
    const [busy_id, setBusyId] = useState<number | "add">();
    const [status, setStatus] = useState<Status>();

    const addable = bots.filter(
        (bot) =>
            bot.kind != "coordinator" &&
            !computer_bots.some((member) => member.id == bot.id),
    );

    const change = async ({
        path,
        bot_id,
    }: {
        path: "add-computer" | "remove-computer";
        bot_id: number;
    }) => {
        setBusyId(path == "add-computer" ? "add" : bot_id);
        setStatus(undefined);

        const res = await postAdminApi({
            path: `bots/${path}`,
            body: { bot_id, computer_id: computer.id },
        });

        setBusyId(undefined);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        if (path == "add-computer") {
            const bot = bots.find((item) => Number(item.id) == bot_id);

            if (bot) {
                setComputerBots((prev) => [...prev, bot]);
            }
        } else {
            setComputerBots((prev) =>
                prev.filter((bot) => Number(bot.id) != bot_id),
            );
        }

        setStatus({ success: true, msg: res.msg || "Saved." });
    };

    return (
        <SettingsGroup
            id="bots"
            title="Bots"
            description="Bots given direct access. The coordinator can use every computer, and in a workspace, every bot there uses the workspace's computers."
        >
            <SettingsList
                is_empty={!computer_bots.length}
                empty="No direct bot access yet."
            >
                {computer_bots.map((bot) => {
                    const locked = isLockedComputerAccess({
                        bot_kind: bot.kind,
                        computer_kind: computer.kind,
                    });
                    const href =
                        bot.kind == "coordinator" && !is_super_admin
                            ? undefined
                            : `/admin/settings/bots/${bot.id}`;

                    return (
                        <ComputerBotRow
                            key={bot.id}
                            bot={bot}
                            href={href}
                            busy={busy_id == bot.id}
                            onRemove={
                                locked
                                    ? undefined
                                    : () =>
                                          change({
                                              path: "remove-computer",
                                              bot_id: Number(bot.id),
                                          })
                            }
                        />
                    );
                })}
            </SettingsList>
            <InlineAddSelect
                id="computer-add-bot"
                noun="bot"
                options={addable.map((bot) => ({
                    value: String(bot.id),
                    title: bot.name || `Bot ${bot.id}`,
                }))}
                loading={busy_id == "add"}
                onAdd={({ value }) =>
                    change({ path: "add-computer", bot_id: Number(value) })
                }
            />
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
