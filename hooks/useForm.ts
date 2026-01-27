// useForm.ts
// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

import { useCallback, useState } from "react";

type Validator<T> = (values: T) => Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, unknown>>(
    initialValues: T,
    validate?: Validator<T>,
): {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (
        cb: () => void,
    ) => (e: React.FormEvent<HTMLFormElement>) => void;
} {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setValues((prev) => ({ ...prev, [name]: value }));
        },
        [],
    );

    const handleSubmit = useCallback(
        (cb: () => void) => (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!validate) return cb();

            const newErrors = validate(values);
            setErrors(newErrors);

            if (Object.keys(newErrors).length === 0) cb();
        },
        [values, validate],
    );

    return { values, errors, handleChange, handleSubmit };
}
