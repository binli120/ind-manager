// Author: Bin Lee
// Email: binlee120@gmail.com

// src/utils/date.ts
export const formatDate = (
    iso: string,
    opts?: Intl.DateTimeFormatOptions,
): string => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...opts,
    });
};

// src/utils/classNames.ts
export function classNames(
    ...classes: Array<string | undefined | false>
): string {
    return classes.filter(Boolean).join(" ");
}

// src/utils/object.ts
export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]) =>
    keys.reduce((res, k) => ({ ...res, [k]: obj[k] }), {} as Pick<T, K>);

export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]) =>
    Object.entries(obj).reduce(
        (res, [k, v]) => (keys.includes(k as K) ? res : { ...res, [k]: v }),
        {} as Omit<T, K>,
    );

// src/utils/noop.ts
export const noop = () => {};
