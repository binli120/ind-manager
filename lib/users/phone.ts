// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com

const PHONE_DIGITS_COUNT = 10;
const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

export const formatPhoneNumberInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, PHONE_DIGITS_COUNT);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const isPhoneNumberValid = (value: string) => PHONE_PATTERN.test(value);
