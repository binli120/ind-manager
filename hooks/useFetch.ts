// useFetch.ts
// Author: Bin Lee
// Email: binlee120@gmail.com

import { useEffect } from "react";
import { useAsyncTask } from "@/hooks/useAsyncTask";
import type { AsyncStatus } from "@/lib/async/async-state";

type FetchResult<T> = {
    data: T | null;
    loading: boolean;
    error: Error | null;
    status: AsyncStatus;
};

export function useFetch<T>(url: string): FetchResult<T> {
  const fetchTask = useAsyncTask(
        async (targetUrl: string) => {
            const response = await fetch(targetUrl);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return (await response.json()) as T;
        },
        null as T | null,
    );
  const { data, error, isLoading, status, reset, run } = fetchTask;

    useEffect(() => {
        if (!url) {
            reset(null);
            return;
        }

        void run(url);
    }, [reset, run, url]);

    return {
        data,
        loading: isLoading,
        error: error ? new Error(error) : null,
        status,
    };
}
