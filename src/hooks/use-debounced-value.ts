import { useEffect, useState } from "react";
import { AppData } from "@/src/data/app-data";

type Params<T> = {
    value: T;
    delay_ms?: number;
};

/**
 * `value` once it has stopped changing for `delay_ms`
 * (`AppData.SearchDebounceMs` by default), so a search box searches as the
 * user types without a request per keystroke. An emptied value comes
 * through at once.
 */
export default function useDebouncedValue<T>({ value, delay_ms = AppData.SearchDebounceMs }: Params<T>) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        if (!value) {
            setDebounced(value);
            return;
        }

        const timer = setTimeout(() => setDebounced(value), delay_ms);

        return () => clearTimeout(timer);
    }, [value, delay_ms]);

    return debounced;
}
