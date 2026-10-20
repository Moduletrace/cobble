/**
 * `useSyncExternalStoreWithSelector` from React's use-sync-external-store
 * (MIT, Meta Platforms, Inc. and affiliates), as an ES module: it reads a
 * store through a selector and only re-renders when the selection
 * changes (`isEqual`).
 */
import { useDebugValue, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

export function useSyncExternalStoreWithSelector(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
    const instRef = useRef(null);

    if (instRef.current === null) instRef.current = { hasValue: false, value: null };

    const inst = instRef.current;

    const [getSelection, getServerSelection] = useMemo(() => {
        let hasMemo = false;
        let memoizedSnapshot;
        let memoizedSelection;

        const memoizedSelector = (nextSnapshot) => {
            if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;

                const nextSelection = selector(nextSnapshot);

                if (isEqual !== undefined && inst.hasValue && isEqual(inst.value, nextSelection)) {
                    memoizedSelection = inst.value;
                    return memoizedSelection;
                }

                memoizedSelection = nextSelection;
                return nextSelection;
            }

            const currentSelection = memoizedSelection;

            if (Object.is(memoizedSnapshot, nextSnapshot)) return currentSelection;

            const nextSelection = selector(nextSnapshot);

            if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
                memoizedSnapshot = nextSnapshot;
                return currentSelection;
            }

            memoizedSnapshot = nextSnapshot;
            memoizedSelection = nextSelection;
            return nextSelection;
        };

        return [
            () => memoizedSelector(getSnapshot()),
            getServerSnapshot === undefined ? undefined : () => memoizedSelector(getServerSnapshot()),
        ];
    }, [getSnapshot, getServerSnapshot, selector, isEqual]);

    const value = useSyncExternalStore(subscribe, getSelection, getServerSelection);

    useEffect(() => {
        inst.hasValue = true;
        inst.value = value;
    }, [value]);

    useDebugValue(value);

    return value;
}
