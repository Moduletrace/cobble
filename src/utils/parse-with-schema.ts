import type { ZodType } from "zod";
import AppError from "./app-error";

type Params<T> = {
    schema: ZodType<T>;
    data: unknown;
};

/**
 * # Parse With Schema
 * Validates untrusted input and throws a user-facing `AppError` with the
 * first issue message when validation fails.
 */
export default function parseWithSchema<T>({ schema, data }: Params<T>): T {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new AppError(
            result.error.issues[0]?.message || "Invalid request",
        );
    }

    return result.data;
}
