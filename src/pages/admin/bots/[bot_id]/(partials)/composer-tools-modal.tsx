import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Img from "@moduletrace/twui/layout/Img";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { CircleAlert, type LucideIcon } from "lucide-react";
import type {
    BotExtension,
    BotExtensionKind,
    BotExtensionsPayload,
    ConnectorAppIcon,
} from "@/src/types";
import KnowledgebaseDocumentsModal from "@/src/pages/admin/settings/knowledgebases/(partials)/knowledgebase-documents-modal";
import ComposerConnectorsSection from "./composer-connectors-section";
import ComposerExtensionsList from "./composer-extensions-list";
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
    /**
     * The knowledgebase whose documents are read from its row; a read-only
     * look at what the bot searches.
     */
    const [viewing, setViewing] = useState<BotExtension>();
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
        <>
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
                        className={twMerge(
                            "shrink-0 gap-1! px-2! py-0.5! text-[12px] leading-4 text-ink-secondary",
                        )}
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

                <ComposerExtensionsList
                    id={copy.id}
                    label={copy.title}
                    items={attached}
                    addable={addable}
                    can_manage={can_manage}
                    busy={busy}
                    add_hint={copy.add_hint}
                    add_noun={copy.add_noun}
                    onAdd={onAdd}
                    onOpenItem={setViewing}
                    onRemove={onRemove}
                />

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
            {viewing ? (
                <KnowledgebaseDocumentsModal
                    knowledgebase={{ id: viewing.id, name: viewing.name }}
                    can_edit={false}
                    onClose={() => setViewing(undefined)}
                />
            ) : null}
        </>
    );
}
