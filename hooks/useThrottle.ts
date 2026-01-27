// useThrottle.ts
// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { useRef } from "react";

export function useThrottle<T>(callback: (arg: T) => void, limit = 200) {
    const lastCall = useRef(0);

    return (arg: T) => {
        const now = Date.now();
        if (now - lastCall.current >= limit) {
            callback(arg);
            lastCall.current = now;
        }
    };
}
