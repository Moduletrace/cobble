/**
 * # EJSON parse string
 */
function parse(
    string: string | null | number,
    reviver?: (this: any, key: string, value: any) => any
): { [s: string]: any } | { [s: string]: any }[] | undefined {
    if (!string) return undefined;
    if (typeof string == "object") return string;
    if (typeof string !== "string") return undefined;
    try {
        return JSON.parse(string, reviver);
    } catch (error) {
        return undefined;
    }
}

/**
 * # EJSON stringify object
 */
function stringify(
    value: any,
    replacer?: ((this: any, key: string, value: any) => any) | null,
    space?: string | number
): string | undefined {
    try {
        return JSON.stringify(value, replacer || undefined, space);
    } catch (error) {
        return undefined;
    }
}

const EJSON = {
    parse,
    stringify,
};

export default EJSON;
