import { z } from "zod";
import type { HarnessTool, HarnessToolDefinition } from "../types";

type Params = {
    tool: HarnessTool;
};

/**
 * What the model sees of a tool: its name, description and arguments as
 * JSON schema (draft 7, the one providers accept most widely).
 */
export default function toolDefinition({ tool }: Params): HarnessToolDefinition {
    const { $schema, ...parameters } = (
        tool.schema
            ? z.toJSONSchema(tool.schema, { target: "draft-7", io: "input" })
            : tool.parameters || { type: "object", properties: {} }
    ) as Record<string, unknown>;

    return {
        name: tool.name,
        description: tool.description,
        parameters,
    };
}
