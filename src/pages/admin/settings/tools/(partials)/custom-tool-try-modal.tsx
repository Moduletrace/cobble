import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { CustomToolsOverviewPayload, PublicCustomTool } from "@/src/types";
import CustomToolTestPanel from "./custom-tool-test-panel";

type Props = {
    tool: PublicCustomTool;
    /**
     * The page data with the tool's new status.
     */
    onTried: (overview: CustomToolsOverviewPayload) => void;
    onClose: () => void;
};

/**
 * Runs a saved tool once with sample arguments (`CustomToolTestPanel`).
 * The run becomes the tool's status.
 */
export default function CustomToolTryModal({ tool, onTried, onClose }: Props) {
    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onClose()}
            title={`Try ${tool.name}`}
            description="Runs it once and shows what a bot would read. A script runs on the main computer, with general envs."
        >
            <Stack className="w-full gap-4! items-stretch pt-4">
                <CustomToolTestPanel target={() => ({ custom_tool_id: tool.id })} onTested={onTried} />
                <Row className="justify-end">
                    <Button title="Close" type="button" variant="ghost" color="gray" size="small" onClick={onClose}>
                        Close
                    </Button>
                </Row>
            </Stack>
        </AddModalShell>
    );
}
