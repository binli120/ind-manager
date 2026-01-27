// useLocalStorage.ts
// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { createLogger } from "@/lib/common/logger";
import { useEffect, useState } from "react";

const logger = createLogger({ module: "hooks" });

/**
 * Helper – safely call an initializer that may be a value or a factory.
 *
 * @param init - The initial value or factory function.
 */
function getInitial<T>(init: T | (() => T)): T {
    // If `init` is a function we know its signature is `() => T`.
    // Using a type guard keeps the compiler happy without an `any` cast.
    if (typeof init === "function") {
        return (init as () => T)(); // ✅ no `Function` type
    }
    return init;
}

/**
 * Persist state to localStorage with a typed API.
 *
 * @param key          The storage key.
 * @param initialValue A value or factory that provides the initial state.
 * @returns [state, setState]
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T | (() => T),
): [T, (val: T | ((prev: T) => T)) => void] {
    /* --------------------------------------------------------------------- */
    /* 1️⃣ Read the stored value (or initialise from `initialValue`)         */
    /* --------------------------------------------------------------------- */
    const readValue = (): T => {
        // If we’re on the server (`window` is undefined) just return the
        // initial value (computed if it’s a function).
        if (typeof window === "undefined") {
            return getInitial(initialValue);
        }

        try {
            const stored = localStorage.getItem(key);

            if (stored !== null) {
                // Stored data exists – parse and return it.
                return JSON.parse(stored) as T;
            }

            // Nothing in storage; initialise from `initialValue`.
            return getInitial(initialValue);
        } catch (_) {
            // If anything goes wrong (e.g. malformed JSON), fall back to the
            // initializer to avoid crashing the app.
            return getInitial(initialValue);
        }
    };

    /* --------------------------------------------------------------------- */
    /* 2️⃣ State & setter                                                      */
    /* --------------------------------------------------------------------- */
    const [storedValue, setStoredValue] = useState<T>(readValue);

    const setValue: (val: T | ((prev: T) => T)) => void = (value) => {
        try {
            // Allow passing a function updater like React’s `setState`.
            const valueToStore = value instanceof Function
                ? (value as (prev: T) => T)(storedValue)
                : value;

            setStoredValue(valueToStore);

            if (typeof window !== "undefined") {
                localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (_) {
            logger.error(_);
        }
    };

    /* --------------------------------------------------------------------- */
    /* 3️⃣ Sync with external changes (e.g. another tab)                     */
    /* --------------------------------------------------------------------- */
    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            // Ignore events that don't refer to our key.
            if (!event.key || event.key !== key) return;

            const newStored = event.newValue !== null
                ? (JSON.parse(event.newValue) as T)
                : getInitial(initialValue);

            setStoredValue(newStored);
        };

        window.addEventListener("storage", handleStorage);

        // Cleanup on unmount
        return () => window.removeEventListener("storage", handleStorage);
    }, [key, initialValue]);

    return [storedValue, setValue];
}
