// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { useEffect, useRef } from "react";

export function useDebouncedCallback<
    T extends (...args: Record<string, unknown>[]) => void,
>(
    callback: T,
    delay = 300,
): T {
    const savedCallback = useRef(callback);
    const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Remember the latest callback
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    return ((...args: Parameters<T>) => {
        if (timerId.current) clearTimeout(timerId.current);
        timerId.current = setTimeout(() => {
            savedCallback.current(...args);
        }, delay);
    }) as T;
}
