import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Img from "@moduletrace/twui/layout/Img";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { CircleAlert, type LucideIcon } from "lucide-react";
import ExtensionAddSelect from "@/src/components/general/extension-add-select";
import type {
    BotExtension,
    BotExtensionKind,
    BotExtensionsPayload,
    ConnectorAppIcon,
} from "@/src/types";
import ComposerConnectorsSection from "./composer-connectors-section";
import ComposerToolRow from "./composer-tool-row";
import { twMerge } from "tailwind-merge";

/**
 * What one of the composer's buttons is about, in copy: its tools, or its
 * knowledgebases.
 */
export type ComposerExtensionsCopy = {
    id: string;
    Icon: LucideIcon;
    /**
     * "tool" and "tools", for the button's count.
     */
    one: string;
    many: string;
    /**
     * The button's label with nothing yet, e.g. "Add tools".
     */
    empty_label: string;
    /**
     * The modal's heading, with the bot's name.
     */
    title: string;
    some: string;
    none: string;
    /**
     * Above the picker, and in its placeholder.
     */
    add_hint: string;
    add_noun: string;
};

type Props = {
    bot_name: string;
    copy: ComposerExtensionsCopy;
    attached: BotExtension[];
    addable: BotExtensionsPayload["addable"];
    can_manage: boolean;
    /**
     * The extension being changed, as `kind:id`.
     */
    busy?: string;
    onAdd: (params: { kind: BotExtensionKind; id: number }) => Promise<boolean>;
    onRemove: (params: {
        kind: BotExtensionKind;
        id: number;
        name: string;
    }) => Promise<boolean>;
    /**
     * Where to read the bot's connectors from, for the tools modal only: the
     * apps it can use here as the person chatting.
     */
    connectors?: { bot_id: number; workspace_id?: number | null };
    /**
     * How many apps connector accounts reach here, counted with the tools
     * (a connector is a tool too).
     */
    connector_count?: number;
    /**
     * Told the live count once the connectors are read, so the button's
     * number follows an add or a remove without a reload.
     */
    onConnectorCount?: (count: number) => void;
    /**
     * The apps a connector account reaches here, drawn as small circles
     * before the spanner (5 at most). Read with the count, so adding or
     * removing one shows without a reload.
     */
    connector_apps?: ConnectorAppIcon[];
    onConnectorApps?: (apps: ConnectorAppIcon[]) => void;
};

/**
 * One of the composer's buttons: how many tools (or knowledgebases) the
 * bot can use here, opening them in a modal rather than filling the
 * composer with chips. Super admins and admins remove any it was given
 * (even one every bot started with) and add more; a workspace's own stay.
 */
export default function ComposerToolsModal({
    bot_name,
    copy,
    attached,
    addable,
    can_manage,
    busy,
    onAdd,
    onRemove,
    connectors,
    connector_count = 0,
    onConnectorCount,
    connector_apps = [],
    onConnectorApps,
}: Props) {
    const [open, setOpen] = useState(false);
    const count = attached.length;
    const total = count + (connectors ? Number(connector_count || 0) : 0);
    const has_problem = attached.some(
        (item) => !item.enabled || item.state == "error",
    );
    const TriggerIcon = has_problem ? CircleAlert : copy.Icon;
    const app_icons = connector_apps.filter((app) => app.logo).slice(0, 5);
    const label = total
        ? `${total} ${total == 1 ? copy.one : copy.many}`
        : copy.empty_label;

    return (
        <Modal
            target={
                <Button
                    title={copy.title}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    beforeIcon={
                        <Row className="items-center gap-1! flex-nowrap">
                            {app_icons.map((app, index) => (
                                <Img
                                    key={app.id}
                                    src={app.logo}
                                    alt={app.name}
                                    title={app.name}
                                    size={16}
                                    circle
                                    className={twMerge(
                                        "shrink-0 border border-hairline bg-white object-contain relative",
                                        index > 0 ? "-ml-1.5" : "",
                                    )}
                                    style={{ zIndex: index + 1 }}
                                />
                            ))}
                            <TriggerIcon size={12} aria-hidden />
                        </Row>
                    }
                    className="shrink-0 gap-1! px-2! py-0.5! text-[12px] leading-4 text-ink-secondary"
                >
                    {label}
                </Button>
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    {copy.title}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {total ? copy.some : copy.none}
                </Span>
            </Stack>

            {count ? (
                <Stack
                    aria-label={copy.title}
                    className="w-full mt-4 py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface"
                >
                    {attached.map((item) => (
                        <ComposerToolRow
                            key={`${item.kind}:${item.id}`}
                            item={item}
                            busy={busy == `${item.kind}:${item.id}`}
                            onRemove={
                                can_manage && item.source == "bot"
                                    ? () =>
                                          onRemove({
                                              kind: item.kind,
                                              id: item.id,
                                              name: item.name,
                                          })
                                    : undefined
                            }
                        />
                    ))}
                </Stack>
            ) : null}

            {can_manage && addable.length ? (
                <Stack className="w-full mt-4 gap-2! items-stretch">
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {copy.add_hint}
                    </Span>
                    <ExtensionAddSelect
                        id={copy.id}
                        noun={copy.add_noun}
                        addable={addable}
                        loading={Boolean(busy)}
                        onAdd={onAdd}
                    />
                </Stack>
            ) : null}

            {connectors ? (
                <ComposerConnectorsSection
                    bot_id={connectors.bot_id}
                    workspace_id={connectors.workspace_id}
                    open={open}
                    onCount={onConnectorCount}
                    onApps={onConnectorApps}
                />
            ) : null}
        </Modal>
    );
}
