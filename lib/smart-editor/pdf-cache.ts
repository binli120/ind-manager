const STORAGE_KEY = 'pdfTextCache';

type CacheRecord = Record<string, string>;

const memoryCache = new Map<string, string>();

function readStorage(): CacheRecord {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheRecord;
  } catch (error) {
    console.warn('Failed to read pdf text cache', error);
    return {};
  }
}

function writeStorage(data: CacheRecord) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to write pdf text cache', error);
  }
}

export function getCachedPdfText(key: string): string | null {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) ?? null;
  }

  const storageData = readStorage();
  const value = storageData[key] ?? null;
  if (value) {
    memoryCache.set(key, value);
  }
  return value;
}

export function setCachedPdfText(key: string, value: string) {
  memoryCache.set(key, value);

  if (typeof window === 'undefined') {
    return;
  }

  const storageData = readStorage();
  storageData[key] = value;
  writeStorage(storageData);
}
// Author: Bin Lee (blee@filynai.com)
// Description: Implements a simple in-memory cache for storing extracted PDF text content in the browser.
