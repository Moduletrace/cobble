import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import CodeEditor from "@/src/components/general/code-editor";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { CustomToolsOverviewPayload, CustomToolTestPayload } from "@/src/types";
import SettingsStatus from "../../(partials)/settings-status";

type Props = {
    /**
     * What to run: `{ custom_tool_id }` for a saved tool, `{ draft }` for
     * the form as it is, or why the form can't be run yet.
     */
    target: () => Record<string, unknown> | string;
    /**
     * The page data after a saved tool's run, with its new status.
     */
    onTested?: (overview: CustomToolsOverviewPayload) => void;
};

/**
 * Runs a tool once with sample arguments and shows whether it worked and
 * what a bot would read. A script runs on the main computer, with general
 * envs.
 */
export default function CustomToolTestPanel({ target, onTested }: Props) {
    const [args, setArgs] = useState("{}");
    const [result, setResult] = useState<{ output: string; ok: boolean }>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const run = async () => {
        if (loading) return;

        const what = target();

        if (typeof what == "string") {
            setError(what);
            return;
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(args || "{}");
        } catch {
            setError("The test arguments aren't valid JSON.");
            return;
        }

        setLoading(true);
        setError(undefined);
        setResult(undefined);

        const res = await postAdminApi<CustomToolTestPayload>({
            path: "tools/test-tool",
            body: { ...what, args: parsed },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't run the tool.");
            return;
        }

        setResult({ output: res.singleRes.output, ok: res.singleRes.ok });
        onTested?.(res.singleRes.overview);
    };

    return (
        <Stack className="w-full gap-3! items-stretch">
            <CodeEditor
                mode="json"
                className="h-28"
                title="Test arguments"
                content={args}
                info="Sample arguments, as a bot would send them."
                onChange={(value) => setArgs(value)}
            />
            <Button
                title="Run it once with these arguments"
                type="button"
                variant="outlined"
                color="gray"
                size="small"
                className="self-start"
                loading={loading}
                disabled={loading}
                onClick={run}
            >
                Test
            </Button>
            <SettingsStatus
                status={
                    error
                        ? { error: true, msg: error }
                        : result
                          ? result.ok
                              ? { success: true, msg: "It worked." }
                              : { error: true, msg: "It failed." }
                          : undefined
                }
            />
            {result ? (
                <Span className="block font-mono text-[13px] leading-[18px] text-ink whitespace-pre-wrap break-words max-h-96 overflow-auto rounded-default-sm border border-solid border-hairline bg-paper p-3">
                    {result.output}
                </Span>
            ) : null}
        </Stack>
    );
}
