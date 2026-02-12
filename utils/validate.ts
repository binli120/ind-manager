// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

/**
 * 1️⃣ Email – RFC‑5322-ish, but not 100 % exhaustive.
 */
export const isEmail = (value: string): boolean => {
    // eslint-disable-next-line no-useless-escape
    const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return emailRegex.test(value.trim());
};

export const isPhoneNumber = (value: string): boolean => {
    // 1. Optional country code: +1 or 001 etc.  (1–3 digits)
    // 2. Optional separator: space, dash, dot, or nothing
    // 3. Area code: 3 digits (with optional parentheses)
    // 4. Separator again
    // 5. Central office code: 3 digits
    // 6. Separator again
    // 7. Line number: 4 digits
    //
    // The regex below implements the above rules.
    const phoneRegex =
        /^(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{3}\)?)[ .-]?\d{3}[ .-]?\d{4}$/;

    return phoneRegex.test(value.trim());
};

/**
 * 3️⃣ Street address – very permissive for US addresses.
 *   - “123 Main St.”
 *   - “456 Elm Ave Apt 7B”
 */
export const isStreetAddress = (value: string): boolean => {
    const streetRegex =
        /^\d+\s+[A-Za-z0-9\s]+(?:\s+(?:St|Ave|Blvd|Rd|Ln|Way|Dr|Ct|Pl|Terr))\.?$/i;
    return streetRegex.test(value.trim());
};

/**
 * Check that a string looks like a real person’s name:
 *
 * - At least 2 characters long (first char + at least one more)
 * - Only letters, spaces, hyphens or apostrophes are permitted
 * - No digits, emojis, symbols like @#$ etc.
 *
 * @param value The raw input from the user
 * @returns true if it passes all checks, false otherwise
 */
export const isNameValid = (value: string): boolean => {
    if (!value) return false; // empty / null

    const trimmed = value.trim();

    // Reject names that are only one character long – e.g. "A"
    if (trimmed.length < 2) return false;

    // The regex:
    //   ^[A-Za-zÀ-ÿ]          → first char must be a letter (including accents)
    //   [A-Za-zÀ-ÿ\s'-]*$     → rest can be letters, space, hyphen or apostrophe
    const nameRegex = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'-]*$/;

    return nameRegex.test(trimmed);
};

export type ValidationResult<T> = {
    [K in keyof T]?: string; // undefined means “no error”
};
type FormFields = {
    email: string;
    phone?: string; // optional, if you want to support missing fields
    address?: string;
    name?: string;
};

export const validateUserInput = (
    data: FormFields,
): ValidationResult<FormFields> => {
    const errors: Partial<Record<keyof FormFields, string>> = {};

    for (const key of Object.keys(data) as Array<keyof FormFields>) {
        const value = String(data[key]).trim();

        switch (key) {
            case "email":
                if (!isEmail(value)) errors.email = "Invalid e‑mail address";
                break;
            case "phone":
                if (!isPhoneNumber(value)) {
                    errors.phone = "Invalid phone number format";
                }
                break;
            case "address":
                if (!isStreetAddress(value)) {
                    errors.address = "Invalid street address";
                }
                break;
            case "name":
                if (!isNameValid(value)) errors.name = "Name is not valid";
                break;
        }
    }

    return errors as ValidationResult<FormFields>;
};
