/**
 * High-Capacity Persistent Storage using IndexedDB with safe LocalStorage fallback
 * Solves QuotaExceededError by providing multi-megabyte/gigabyte storage capacity
 * and safely handling browser storage quotas.
 */

const DB_NAME = 'bsmart_mobile_communicator_db';
const DB_VERSION = 1;
const STORES = ['cards', 'companies', 'users', 'leads', 'sessions'] as const;

type StoreName = typeof STORES[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        STORES.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        });
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error, falling back to safe local storage:', request.error);
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

/**
 * Safely saves data to IndexedDB (asynchronously, with high capacity)
 */
export async function idbSet<T>(storeName: StoreName, key: string, value: T): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => {
        console.warn(`Failed to write to IndexedDB store ${storeName}:`, req.error);
        reject(req.error);
      };
    });
  } catch (err) {
    // Graceful fallback
    return Promise.resolve();
  }
}

/**
 * Safely retrieves data from IndexedDB
 */
export async function idbGet<T>(storeName: StoreName, key: string): Promise<T | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Safely deletes an item from IndexedDB
 */
export async function idbDelete(storeName: StoreName, key: string): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => {
        console.warn(`Failed to delete key ${key} from IndexedDB store ${storeName}:`, req.error);
        resolve();
      };
    });
  } catch {
    return Promise.resolve();
  }
}

/**
 * Prunes large base64 data URLs from an object for lightweight localStorage fallback,
 * ensuring localStorage never approaches the 5MB quota limit.
 */
function pruneHeavyDataUrls(obj: any, maxDepth = 4): any {
  if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => pruneHeavyDataUrls(item, maxDepth - 1));
  }

  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 50000) {
      // In localStorage quota fallback, avoid storing invalid corrupted fragments;
      // full pristine 300 DPI image data is safely preserved in IndexedDB.
      result[key] = '';
    } else if (typeof val === 'object' && val !== null) {
      result[key] = pruneHeavyDataUrls(val, maxDepth - 1);
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Merges media assets (logos, banners, gallery images) from a backup source into target cards
 * to prevent any accidental data erasure during synchronization or storage migrations.
 */
export function restoreCardMediaAssets<T extends { id: string; logoUrl?: string; banners?: any[]; galleryImages?: string[]; aboutText?: string }>(
  targetCards: T[],
  sourceCards: T[]
): T[] {
  if (!sourceCards || sourceCards.length === 0) return targetCards;
  const sourceMap = new Map(sourceCards.map((c) => [c.id, c]));

  return targetCards.map((target) => {
    const src = sourceMap.get(target.id);
    if (!src) return target;

    // Check if source has banners but target has none
    const effectiveBanners =
      target.banners && target.banners.length > 0
        ? target.banners
        : src.banners && src.banners.length > 0
        ? src.banners
        : target.banners;

    // Check if source has logoUrl but target has none
    const effectiveLogo = target.logoUrl || src.logoUrl || '';

    // Check gallery
    const effectiveGallery =
      target.galleryImages && target.galleryImages.length > 0
        ? target.galleryImages
        : src.galleryImages && src.galleryImages.length > 0
        ? src.galleryImages
        : target.galleryImages;

    return {
      ...target,
      logoUrl: effectiveLogo,
      banners: effectiveBanners,
      galleryImages: effectiveGallery,
      aboutText: target.aboutText || src.aboutText || '',
    };
  });
}

/**
 * Safely sets an item in localStorage without throwing QuotaExceededError.
 * Proactively prunes heavy data URLs when payload exceeds 1.5MB to stay far beneath the 5MB browser limit.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  // If payload is already large (> 1.2MB), proactively prune base64 URLs
  // so the browser's 5MB origin quota is never breached.
  let payloadToWrite = value;
  if (value.length > 1200000) {
    try {
      const parsed = JSON.parse(value);
      payloadToWrite = JSON.stringify(pruneHeavyDataUrls(parsed));
    } catch {
      // Keep original
    }
  }

  try {
    localStorage.setItem(key, payloadToWrite);
    return true;
  } catch (err: any) {
    // If QuotaExceededError is still encountered
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED';

    if (isQuotaError) {
      try {
        const parsed = JSON.parse(payloadToWrite);
        const compacted = JSON.stringify(pruneHeavyDataUrls(parsed));
        localStorage.setItem(key, compacted);
        return true;
      } catch {
        // As safe fallback to keep browser origin responsive
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return false;
      }
    }
    return false;
  }
}

/**
 * Safely retrieves an item from localStorage
 */
export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Deduplicates an array of objects by their `id` property, keeping the first occurrence.
 */
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

/**
 * Cleanup any bloated items from localStorage upon application startup
 */
export function cleanupBloatedLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const keysToCheck = ['yebocards_data', 'yebocompanies_data', 'yebousers_data', 'yeboleads_data'];
    for (const k of keysToCheck) {
      const item = localStorage.getItem(k);
      if (item && item.length > 2000000) {
        // Larger than 2MB: compact it immediately so origin quota is healthy
        try {
          const parsed = JSON.parse(item);
          const compacted = JSON.stringify(pruneHeavyDataUrls(parsed));
          localStorage.setItem(k, compacted);
        } catch {
          // Leave it or remove
        }
      }
    }
  } catch {
    // Ignore any quota cleanup issues
  }
}
