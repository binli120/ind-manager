// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Exact<T, Shape extends T> = T & {
  [K in Exclude<keyof Shape, keyof T>]: never;
};

// classNames.ts
export function classNames(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const err = error as {
      name?: unknown;
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts: string[] = [];
    if (typeof err.name === "string") parts.push(err.name);
    if (typeof err.code === "string") parts.push(`code:${err.code}`);
    if (typeof err.message === "string") parts.push(err.message);
    if (typeof err.details === "string") parts.push(err.details);
    if (typeof err.hint === "string") parts.push(err.hint);
    if (parts.length > 0) return parts.join(" - ");
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error (unserializable object)";
    }
  }
  return "Unknown error (no message)";
}

export function isAdminEmail(email?: string | null) {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes(" ")) return false;
  const parts = normalized.split("@");
  if (parts.length !== 2) return false;
  return parts[1] === "filynai.com";
}
