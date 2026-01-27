// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Exact<T, Shape extends T> =
  & T
  & {
    [K in Exclude<keyof Shape, keyof T>]: never;
  };

// classNames.ts
export function classNames(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}
