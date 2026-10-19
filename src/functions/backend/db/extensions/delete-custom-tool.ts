import BunSQLite from "@moduletrace/bun-sqlite";
import grabCustomTool from "./grab-custom-tool";

type Params = {
    custom_tool_id: number | string;
};

/**
 * Deletes a custom tool; its attachments go with it.
 */
export default async function deleteCustomTool({ custom_tool_id }: Params) {
    const tool = await grabCustomTool({ custom_tool_id });
    const res = await BunSQLite.sql({ sql: `DELETE FROM custom_tools WHERE id = ?`, values: [tool.id] });

    if (!res.success) throw new Error(`Couldn't delete the tool: ${res.error}`);

    return tool;
}
