// useFetch.ts
// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { useEffect, useState } from "react";

type FetchResult<T> = {
    data: T | null;
    loading: boolean;
    error: Error | null;
};

export function useFetch<T>(url: string): FetchResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true; // cancel on unmount
        setLoading(true);
        fetch(url)
            .then((res) => res.json())
            .then((json) => {
                if (isMounted) setData(json);
            })
            .catch((err) => {
                if (isMounted) setError(err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [url]);

    return { data, loading, error };
}
