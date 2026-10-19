import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ExternalLink } from "lucide-react";
import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import type { ComputerWithStatus } from "@/src/types";
import computerResourcesLabel from "@/src/utils/computer-resources-label";
import computerStatusLabel from "@/src/utils/computer-status-label";
import computerViewUrl from "@/src/utils/computer-view-url";
import SettingsGroup from "../../../(partials)/settings-group";

type Props = {
    computer: ComputerWithStatus;
};

/**
 * The computer at a glance: its state, resources and what it's for, and a
 * way to open it in the browser.
 */
export default function ComputerOverviewGroup({ computer }: Props) {
    const name = computer.name || `Computer ${computer.id}`;
    const ready = computer.status == "running";

    return (
        <SettingsGroup
            id="overview"
            title="Overview"
            description="What this computer is, and its container's state."
        >
            <Row className="w-full gap-4! flex-nowrap items-center">
                <ComputerIconTile />
                <Stack className="grow min-w-0 gap-0!">
                    <Row className="gap-2! flex-nowrap items-center">
                        <Span className="text-sm font-bold leading-5 text-ink truncate">
                            {name}
                        </Span>
                        {computer.kind == "main" ? (
                            <Span className="shrink-0 text-[11px] font-bold leading-4 text-ink-secondary">
                                Main
                            </Span>
                        ) : null}
                    </Row>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary truncate w-full">
                        {[
                            computerStatusLabel({ computer }),
                            computerResourcesLabel({ computer }),
                            computer.description,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </Span>
                </Stack>
                <Button
                    title={
                        ready
                            ? `Open ${name} in the browser`
                            : `${name} isn't running yet`
                    }
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="small"
                    href={
                        ready
                            ? computerViewUrl({
                                  computer_id: Number(computer.id),
                                  mode: "browser",
                              })
                            : undefined
                    }
                    target="_blank"
                    disabled={!ready}
                    beforeIcon={<ExternalLink size={14} aria-hidden />}
                    className="shrink-0"
                >
                    Open
                </Button>
            </Row>
        </SettingsGroup>
    );
}
