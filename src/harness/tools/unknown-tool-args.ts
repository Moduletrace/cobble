import { z } from "zod";

type Params = {
    schema?: z.ZodType;
    args: Record<string, unknown>;
};

/**
 * The argument names a call gave that its tool doesn't take. Zod drops
 * unknown keys without a word, so a model that wrote `id` for
 * `workspace_id` would only hear that no id was given and retry the same
 * call. Only object schemas are checked (refined ones too); anything else
 * returns none.
 */
export default function unknownToolArgs({ schema, args }: Params): { unknown: string[]; known: string[] } {
    if (!(schema instanceof z.ZodObject)) return { unknown: [], known: [] };

    const known = Object.keys(schema.shape);

    return { unknown: Object.keys(args).filter((key) => !known.includes(key)), known };
}
