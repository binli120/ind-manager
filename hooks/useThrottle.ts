// useThrottle.ts
// Author: Bin Lee
// Email: binlee120@gmail.com

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
