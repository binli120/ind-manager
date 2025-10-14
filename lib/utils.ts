import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Exact<T, Shape extends T> = T & {
  [K in Exclude<keyof Shape, keyof T>]: never;
};
