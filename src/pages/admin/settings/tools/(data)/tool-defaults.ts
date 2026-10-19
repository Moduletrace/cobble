import type { CustomToolHttpConfig, CustomToolPromptConfig, CustomToolScriptConfig } from "@/src/types";

/**
 * What a new tool's arguments schema starts as.
 */
export const DefaultToolParameters = JSON.stringify(
    {
        type: "object",
        properties: {
            city: { type: "string", description: "The city to look up" },
        },
        required: ["city"],
    },
    null,
    2,
);

/**
 * What a tool's config starts as for each kind.
 */
export const DefaultToolConfigs: {
    http: CustomToolHttpConfig;
    script: CustomToolScriptConfig;
    prompt: CustomToolPromptConfig;
} = {
    http: { method: "GET", url: "", headers: {}, body: "" },
    script: {
        language: "python",
        code: `import json, os\n\nargs = json.loads(os.environ["COBBLE_ARGS"])\nprint(f"Hello from {args.get('city')}")\n`,
    },
    prompt: { prompt: "" },
};
